const _rooms = new Map();

export function getRoom(pin) {
  return _rooms.get(pin) ?? null;
}

export function getOrCreateRoom(pin, quiz) {
  const existing = _rooms.get(pin);
  if (existing) return existing;
  const room = {
    pin,
    quiz,
    status: "lobby",
    currentQ: -1,
    question_started_at: null,
    players: {},
    answers: [],
    hostId: null,
  };
  _rooms.set(pin, room);
  return room;
}

export function deleteRoom(pin) {
  _rooms.delete(pin);
}

export function allRooms() {
  return _rooms.values();
}

export function publicState(room) {
  return {
    pin: room.pin,
    status: room.status,
    currentQ: room.currentQ,
    question_started_at: room.question_started_at,
    quiz: room.quiz,
    players: Object.values(room.players),
  };
}

export function hasAnswered(room, playerId) {
  return room.answers.some(
    (a) => a.playerId === playerId && a.questionIndex === room.currentQ
  );
}
