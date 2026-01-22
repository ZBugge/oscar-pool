import { runQuery } from '../db/schema.js';

export interface LeaderboardEntry {
  participantId: number;
  name: string;
  score: number;
  correctPicks: number;
  totalPicks: number;
  rank: number;
}

export interface LeaderboardStats {
  totalParticipants: number;
  categoriesAnnounced: number;
  totalCategories: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  stats: LeaderboardStats;
  lobbyName: string;
  lobbyStatus: string;
}

export async function getLeaderboard(lobbyId: string): Promise<LeaderboardResponse> {
  // Get lobby info
  const lobbies = await runQuery<{ name: string; status: string }>(
    'SELECT name, status FROM lobbies WHERE id = ?',
    [lobbyId]
  );

  if (lobbies.length === 0) {
    throw new Error('Lobby not found');
  }

  const lobby = lobbies[0];

  // Get all participants in this lobby
  const participants = await runQuery<{ id: number; name: string }>(
    'SELECT id, name FROM participants WHERE lobby_id = ? ORDER BY submitted_at',
    [lobbyId]
  );

  // Get total categories
  const categoryCount = await runQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
    []
  );
  const totalCategories = categoryCount[0]?.count || 0;

  // Get categories with announced winners
  const announcedCount = await runQuery<{ count: number }>(
    'SELECT COUNT(DISTINCT category_id) as count FROM nominees WHERE is_winner = 1',
    []
  );
  const categoriesAnnounced = announcedCount[0]?.count || 0;

  // Get all winners
  const winners = await runQuery<{ category_id: number; nominee_id: number }>(
    'SELECT category_id, id as nominee_id FROM nominees WHERE is_winner = 1',
    []
  );
  const winnerMap = new Map(winners.map(w => [w.category_id, w.nominee_id]));

  // Calculate scores for each participant
  const entries: Omit<LeaderboardEntry, 'rank'>[] = [];

  for (const participant of participants) {
    // Get participant's predictions
    const predictions = await runQuery<{ category_id: number; nominee_id: number }>(
      'SELECT category_id, nominee_id FROM predictions WHERE participant_id = ?',
      [participant.id]
    );

    let correctPicks = 0;
    for (const pred of predictions) {
      const winnerId = winnerMap.get(pred.category_id);
      if (winnerId !== undefined && winnerId === pred.nominee_id) {
        correctPicks++;
      }
    }

    entries.push({
      participantId: participant.id,
      name: participant.name,
      score: correctPicks, // 1 point per correct pick
      correctPicks,
      totalPicks: predictions.length,
    });
  }

  // Sort by score descending, then by name ascending for tiebreaker
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Assign ranks (shared ranks for ties)
  const rankedEntries: LeaderboardEntry[] = [];
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // Check if this entry has the same score as the previous
    if (i > 0 && entries[i - 1].score === entry.score) {
      // Share the same rank
      rankedEntries.push({ ...entry, rank: rankedEntries[i - 1].rank });
    } else {
      rankedEntries.push({ ...entry, rank: currentRank });
    }
    currentRank++;
  }

  return {
    entries: rankedEntries,
    stats: {
      totalParticipants: participants.length,
      categoriesAnnounced,
      totalCategories,
    },
    lobbyName: lobby.name,
    lobbyStatus: lobby.status,
  };
}
