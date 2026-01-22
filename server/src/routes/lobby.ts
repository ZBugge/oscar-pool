import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createLobby,
  getLobbyById,
  getLobbiesByAdmin,
  lockLobby,
  unlockLobby,
  completeLobby,
  getParticipantsByLobby,
  deleteParticipant,
  deleteMultipleParticipants,
  deleteLobby,
  getParticipantById,
} from '../services/lobby.js';
import { getCategoriesWithNominees } from '../services/category.js';
import { canCreateLobby } from '../services/limits.js';

const router = express.Router();

// Create lobby
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Lobby name required' });
    }

    // Check if admin can create another lobby
    const limitCheck = await canCreateLobby(req.session.adminId!);
    if (!limitCheck.allowed) {
      return res.status(429).json({ error: limitCheck.reason });
    }

    const lobby = await createLobby(req.session.adminId!, name.trim());
    res.json(lobby);
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

// Get admin's lobbies
router.get('/my-lobbies', requireAuth, async (req, res) => {
  try {
    const lobbies = await getLobbiesByAdmin(req.session.adminId!);
    res.json(lobbies);
  } catch (error) {
    console.error('Get lobbies error:', error);
    res.status(500).json({ error: 'Failed to get lobbies' });
  }
});

// Get lobby by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    res.json(lobby);
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({ error: 'Failed to get lobby' });
  }
});

// Get categories for prediction form (public)
router.get('/:id/categories', async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    const categories = await getCategoriesWithNominees();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get participants for a lobby
router.get('/:id/participants', async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    const participants = await getParticipantsByLobby(req.params.id);
    res.json(participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

// Lock lobby
router.patch('/:id/lock', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await lockLobby(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Lock lobby error:', error);
    res.status(500).json({ error: 'Failed to lock lobby' });
  }
});

// Unlock lobby
router.patch('/:id/unlock', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await unlockLobby(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Unlock lobby error:', error);
    res.status(500).json({ error: 'Failed to unlock lobby' });
  }
});

// Complete lobby
router.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await completeLobby(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Complete lobby error:', error);
    res.status(500).json({ error: 'Failed to complete lobby' });
  }
});

// Delete participant
router.delete('/:lobbyId/participants/:participantId', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.lobbyId);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const participant = await getParticipantById(parseInt(req.params.participantId));
    if (!participant || participant.lobby_id !== req.params.lobbyId) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    await deleteParticipant(parseInt(req.params.participantId));
    res.json({ success: true });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

// Bulk delete participants
router.post('/:lobbyId/participants/bulk-delete', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.lobbyId);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { participantIds } = req.body;
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'participantIds must be an array' });
    }

    await deleteMultipleParticipants(participantIds);
    res.json({ success: true, deletedCount: participantIds.length });
  } catch (error) {
    console.error('Bulk delete participants error:', error);
    res.status(500).json({ error: 'Failed to delete participants' });
  }
});

// Delete lobby
router.delete('/:lobbyId', requireAuth, async (req, res) => {
  try {
    const lobby = await getLobbyById(req.params.lobbyId);

    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.admin_id !== req.session.adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await deleteLobby(req.params.lobbyId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete lobby error:', error);
    res.status(500).json({ error: 'Failed to delete lobby' });
  }
});

export default router;
