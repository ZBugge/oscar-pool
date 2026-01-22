import express from 'express';
import { getLeaderboard } from '../services/leaderboard.js';

const router = express.Router();

// Get leaderboard for a lobby (public)
router.get('/:lobbyId', async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const leaderboard = await getLeaderboard(lobbyId);
    res.json(leaderboard);
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(400).json({ error: error.message || 'Failed to get leaderboard' });
  }
});

export default router;
