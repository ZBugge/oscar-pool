import { runQuery, runInsert } from '../db/schema.js';
import type { Participant } from '../db/schema.js';

export interface SubmitPredictionsInput {
  lobbyId: string;
  participantName: string;
  predictions: { categoryId: number; nomineeId: number }[];
}

export async function submitPredictions(input: SubmitPredictionsInput): Promise<Participant> {
  const { lobbyId, participantName, predictions } = input;

  // Verify lobby exists and is open
  const lobbies = await runQuery<{ id: string; status: string }>(
    'SELECT id, status FROM lobbies WHERE id = ?',
    [lobbyId]
  );

  if (lobbies.length === 0) {
    throw new Error('Lobby not found');
  }

  if (lobbies[0].status !== 'open') {
    throw new Error('This lobby is no longer accepting predictions');
  }

  // Check for duplicate participant name in this lobby
  const existing = await runQuery<{ id: number }>(
    'SELECT id FROM participants WHERE lobby_id = ? AND LOWER(name) = LOWER(?)',
    [lobbyId, participantName.trim()]
  );

  if (existing.length > 0) {
    throw new Error('A participant with this name already exists in this lobby');
  }

  // Verify all categories have predictions
  const categories = await runQuery<{ id: number }>(
    'SELECT id FROM categories ORDER BY display_order',
    []
  );

  const categoryIds = categories.map(c => c.id);
  const submittedCategoryIds = predictions.map(p => p.categoryId);

  for (const catId of categoryIds) {
    if (!submittedCategoryIds.includes(catId)) {
      throw new Error('Please make a prediction for all categories');
    }
  }

  // Verify all nominees exist and belong to correct categories
  for (const pred of predictions) {
    const nominees = await runQuery<{ id: number }>(
      'SELECT id FROM nominees WHERE id = ? AND category_id = ?',
      [pred.nomineeId, pred.categoryId]
    );

    if (nominees.length === 0) {
      throw new Error('Invalid nominee selection');
    }
  }

  // Create participant
  const participantId = await runInsert(
    'INSERT INTO participants (lobby_id, name) VALUES (?, ?)',
    [lobbyId, participantName.trim()]
  );

  // Create predictions
  for (const pred of predictions) {
    await runInsert(
      'INSERT INTO predictions (participant_id, category_id, nominee_id) VALUES (?, ?, ?)',
      [participantId, pred.categoryId, pred.nomineeId]
    );
  }

  const participant = await runQuery<Participant>(
    'SELECT * FROM participants WHERE id = ?',
    [participantId]
  );

  return participant[0];
}

export interface ParticipantPick {
  categoryId: number;
  categoryName: string;
  nomineeId: number;
  nomineeName: string;
  winnerId: number | null;
  winnerName: string | null;
  isCorrect: boolean | null;
}

export async function getParticipantPicks(participantId: number, lobbyId: string): Promise<ParticipantPick[]> {
  // Verify participant exists and belongs to the lobby
  const participants = await runQuery<Participant>(
    'SELECT * FROM participants WHERE id = ? AND lobby_id = ?',
    [participantId, lobbyId]
  );

  if (participants.length === 0) {
    throw new Error('Participant not found');
  }

  // Get all predictions with category and nominee info
  const picks = await runQuery<{
    category_id: number;
    category_name: string;
    category_order: number;
    nominee_id: number;
    nominee_name: string;
  }>(
    `SELECT
      c.id as category_id,
      c.name as category_name,
      c.display_order as category_order,
      n.id as nominee_id,
      n.name as nominee_name
    FROM predictions p
    JOIN categories c ON p.category_id = c.id
    JOIN nominees n ON p.nominee_id = n.id
    WHERE p.participant_id = ?
    ORDER BY c.display_order`,
    [participantId]
  );

  // Get winners for each category
  const winners = await runQuery<{
    category_id: number;
    winner_id: number;
    winner_name: string;
  }>(
    `SELECT
      n.category_id,
      n.id as winner_id,
      n.name as winner_name
    FROM nominees n
    WHERE n.is_winner = 1`,
    []
  );

  const winnerMap = new Map(winners.map(w => [w.category_id, w]));

  return picks.map(pick => {
    const winner = winnerMap.get(pick.category_id);
    return {
      categoryId: pick.category_id,
      categoryName: pick.category_name,
      nomineeId: pick.nominee_id,
      nomineeName: pick.nominee_name,
      winnerId: winner?.winner_id ?? null,
      winnerName: winner?.winner_name ?? null,
      isCorrect: winner ? pick.nominee_id === winner.winner_id : null,
    };
  });
}
