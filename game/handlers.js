import {
  getRoom,
  getOrCreateRoom,
  deleteRoom,
  allRooms,
  publicState,
  hasAnswered,
} from "./rooms.js";

function broadcast(io, pin, room) {
  io.to(pin).emit("room-state", publicState(room));
}

function scheduleCleanup(pin) {
  setTimeout(() => deleteRoom(pin), 5 * 60 * 1000);
}

export function registerHandlers(io, socket) {
  socket.on("create-room", ({ pin, quiz } = {}, cb) => {
    if (!pin || !quiz?.problems?.length) {
      return cb?.({ success: false, message: "PIN yoki quiz ma'lumotlari yetarli emas." });
    }
    const room = getOrCreateRoom(pin, quiz);
    room.hostId = socket.id;
    room.quiz = quiz;
    socket.join(pin);
    broadcast(io, pin, room);
    cb?.({ success: true, state: publicState(room) });
  });

  socket.on("join-room", ({ pin, name } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Bunday PIN topilmadi." });

    const playerId = `player-${socket.id}`;
    room.players[playerId] = {
      id: playerId,
      name: name?.trim() || "O'yinchi",
      score: 0,
    };
    socket.join(pin);
    broadcast(io, pin, room);
    cb?.({ success: true, player: room.players[playerId], state: publicState(room) });
  });

  socket.on("start-game", ({ pin } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Room topilmadi." });
    room.status = "question";
    room.currentQ = 0;
    room.question_started_at = new Date().toISOString();
    room.answers = [];
    broadcast(io, pin, room);
    cb?.({ success: true, state: publicState(room) });
  });

  socket.on("show-results", ({ pin } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Room topilmadi." });
    room.status = "results";
    broadcast(io, pin, room);
    cb?.({ success: true, state: publicState(room) });
  });

  socket.on("next-question", ({ pin } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Room topilmadi." });

    const next = room.currentQ + 1;
    if (next >= room.quiz.problems.length) {
      room.status = "ended";
      room.question_started_at = null;
    } else {
      room.status = "question";
      room.currentQ = next;
      room.question_started_at = new Date().toISOString();
    }
    broadcast(io, pin, room);
    cb?.({ success: true, state: publicState(room) });
  });

  socket.on("player-answer", ({ pin, playerId, choiceIndex } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Room topilmadi." });
    if (room.status !== "question") return cb?.({ success: false, message: "Hozir javob berish mumkin emas." });

    const player = room.players[playerId];
    if (!player) return cb?.({ success: false, message: "O'yinchi topilmadi." });
    if (hasAnswered(room, playerId)) return cb?.({ success: false, message: "Siz allaqachon javob berdingiz." });

    const problem = room.quiz.problems[room.currentQ];
    if (!problem) return cb?.({ success: false, message: "Savol topilmadi." });

    const correctIdx = problem.correct ?? problem.correct_index ?? -1;
    const isCorrect = Number(choiceIndex) === correctIdx;

    let points = 0;
    if (isCorrect) {
      const elapsed = (Date.now() - new Date(room.question_started_at).getTime()) / 1000;
      const limit = problem.time_limit ?? 20;
      const ratio = Math.max(0, 1 - elapsed / limit);
      points = Math.max(50, Math.round(1000 * ratio));
    }

    if (isCorrect) player.score += points;
    room.answers.push({ playerId, questionIndex: room.currentQ, choiceIndex, isCorrect, points });

    broadcast(io, pin, room);
    cb?.({ success: true, correct: isCorrect, points, state: publicState(room) });
  });

  socket.on("end-game", ({ pin } = {}, cb) => {
    const room = getRoom(pin);
    if (!room) return cb?.({ success: false, message: "Room topilmadi." });
    room.status = "ended";
    room.question_started_at = null;
    broadcast(io, pin, room);
    cb?.({ success: true, state: publicState(room) });
    scheduleCleanup(pin);
  });

  socket.on("leave-room", ({ pin, playerId } = {}) => {
    const room = getRoom(pin);
    if (!room) return;
    delete room.players[playerId];
    socket.leave(pin);
    broadcast(io, pin, room);
  });

  socket.on("disconnect", () => {
    for (const room of allRooms()) {
      const removed = Object.keys(room.players).filter((k) => k.includes(socket.id));
      if (removed.length) {
        removed.forEach((k) => delete room.players[k]);
        broadcast(io, room.pin, room);
      }
      if (room.hostId === socket.id) {
        room.status = "ended";
        room.question_started_at = null;
        broadcast(io, room.pin, room);
        scheduleCleanup(room.pin);
      }
    }
  });
}
