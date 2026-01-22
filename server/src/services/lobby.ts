import { nanoid } from 'nanoid';
import { runQuery, runInsert, runExec, type Lobby, type Participant, type Prediction } from '../db/schema.js';

// Lobby CRUD operations

export async function createLobby(adminId: number, name: string): Promise<Lobby> {
  const lobbyId = nanoid(10);

  await runExec(
    'INSERT INTO lobbies (id, admin_id, name) VALUES (?, ?, ?)',
    [lobbyId, adminId, name]
  );

  return (await getLobbyById(lobbyId))!;
}

export async function getLobbyById(id: string): Promise<Lobby | undefined> {
  const results = await runQuery<Lobby>('SELECT * FROM lobbies WHERE id = ?', [id]);
  return results[0];
}

export interface LobbyWithCount extends Lobby {
  participant_count: number;
}

export async function getLobbiesByAdmin(adminId: number): Promise<LobbyWithCount[]> {
  return runQuery<LobbyWithCount>(
    `SELECT l.*, COUNT(p.id) as participant_count
     FROM lobbies l
     LEFT JOIN participants p ON l.id = p.lobby_id
     WHERE l.admin_id = ?
     GROUP BY l.id
     ORDER BY l.created_at DESC`,
    [adminId]
  );
}

// Lobby status management

export async function lockLobby(lobbyId: string): Promise<Lobby | undefined> {
  await runExec(
    "UPDATE lobbies SET status = 'locked', locked_at = CURRENT_TIMESTAMP WHERE id = ?",
    [lobbyId]
  );
  return getLobbyById(lobbyId);
}

export async function unlockLobby(lobbyId: string): Promise<Lobby | undefined> {
  await runExec(
    "UPDATE lobbies SET status = 'open', locked_at = NULL WHERE id = ?",
    [lobbyId]
  );
  return getLobbyById(lobbyId);
}

export async function completeLobby(lobbyId: string): Promise<Lobby | undefined> {
  await runExec(
    "UPDATE lobbies SET status = 'completed' WHERE id = ?",
    [lobbyId]
  );
  return getLobbyById(lobbyId);
}

// Participant operations

export async function addParticipant(lobbyId: string, name: string): Promise<Participant> {
  const id = await runInsert('INSERT INTO participants (lobby_id, name) VALUES (?, ?)', [lobbyId, name]);
  return (await getParticipantById(id))!;
}

export async function getParticipantById(id: number): Promise<Participant | undefined> {
  const results = await runQuery<Participant>('SELECT * FROM participants WHERE id = ?', [id]);
  return results[0];
}

export async function getParticipantsByLobby(lobbyId: string): Promise<Participant[]> {
  return runQuery<Participant>('SELECT * FROM participants WHERE lobby_id = ? ORDER BY submitted_at', [lobbyId]);
}

export async function getParticipantByNameAndLobby(lobbyId: string, name: string): Promise<Participant | undefined> {
  const results = await runQuery<Participant>(
    'SELECT * FROM participants WHERE lobby_id = ? AND name = ?',
    [lobbyId, name]
  );
  return results[0];
}

// Prediction operations

export async function addPrediction(participantId: number, categoryId: number, nomineeId: number): Promise<void> {
  await runExec(
    'INSERT INTO predictions (participant_id, category_id, nominee_id) VALUES (?, ?, ?)',
    [participantId, categoryId, nomineeId]
  );
}

export async function getPredictionsByParticipant(participantId: number): Promise<Prediction[]> {
  return runQuery<Prediction>('SELECT * FROM predictions WHERE participant_id = ?', [participantId]);
}

export async function getPredictionsByLobby(lobbyId: string): Promise<Array<Prediction & { participant_name: string }>> {
  return runQuery<Prediction & { participant_name: string }>(`
    SELECT pr.*, pt.name as participant_name
    FROM predictions pr
    JOIN participants pt ON pr.participant_id = pt.id
    WHERE pt.lobby_id = ?
  `, [lobbyId]);
}

// Delete operations

export async function deleteParticipant(participantId: number): Promise<void> {
  // Delete all predictions for this participant
  await runExec('DELETE FROM predictions WHERE participant_id = ?', [participantId]);
  // Delete the participant
  await runExec('DELETE FROM participants WHERE id = ?', [participantId]);
}

export async function deleteMultipleParticipants(participantIds: number[]): Promise<void> {
  if (participantIds.length === 0) return;

  const placeholders = participantIds.map(() => '?').join(',');

  // Delete all predictions for these participants
  await runExec(`DELETE FROM predictions WHERE participant_id IN (${placeholders})`, participantIds);
  // Delete the participants
  await runExec(`DELETE FROM participants WHERE id IN (${placeholders})`, participantIds);
}

export async function deleteLobby(lobbyId: string): Promise<void> {
  // Get all participants for this lobby
  const participants = await getParticipantsByLobby(lobbyId);
  const participantIds = participants.map(p => p.id);

  // Delete all predictions for all participants in this lobby
  if (participantIds.length > 0) {
    const placeholders = participantIds.map(() => '?').join(',');
    await runExec(`DELETE FROM predictions WHERE participant_id IN (${placeholders})`, participantIds);
  }

  // Delete all participants in this lobby
  await runExec('DELETE FROM participants WHERE lobby_id = ?', [lobbyId]);

  // Delete the lobby
  await runExec('DELETE FROM lobbies WHERE id = ?', [lobbyId]);
}
