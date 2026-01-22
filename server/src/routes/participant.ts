import express from 'express';
import { submitPredictions, getParticipantPicks } from '../services/participant.js';
import { getLobbyById } from '../services/lobby.js';
import { canAddParticipant } from '../services/limits.js';

const router = express.Router();

// Submit predictions (public - anyone with the link can submit)
router.post('/submit', async (req, res) => {
  try {
    const { lobbyId, participantName, predictions } = req.body;

    if (!lobbyId || !participantName || !predictions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!participantName.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({ error: 'Predictions are required' });
    }

    // Check participant limits
    const limitCheck = await canAddParticipant(lobbyId);
    if (!limitCheck.allowed) {
      return res.status(429).json({ error: limitCheck.reason });
    }

    const participant = await submitPredictions({
      lobbyId,
      participantName: participantName.trim(),
      predictions,
    });

    res.json(participant);
  } catch (error: any) {
    console.error('Submit predictions error:', error);
    res.status(400).json({ error: error.message || 'Failed to submit predictions' });
  }
});

// Get participant's picks (public - but only visible after lobby is locked)
router.get('/:participantId/picks', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { lobbyId } = req.query;

    if (!lobbyId || typeof lobbyId !== 'string') {
      return res.status(400).json({ error: 'lobbyId query parameter is required' });
    }

    // Verify lobby exists
    const lobby = await getLobbyById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    // Only allow viewing picks if lobby is locked or completed
    if (lobby.status === 'open') {
      return res.status(403).json({ error: 'Picks are hidden until the lobby is locked' });
    }

    const picks = await getParticipantPicks(parseInt(participantId), lobbyId);
    res.json(picks);
  } catch (error: any) {
    console.error('Get picks error:', error);
    res.status(400).json({ error: error.message || 'Failed to get picks' });
  }
});

export default router;
