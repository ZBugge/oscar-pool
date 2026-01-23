import express from 'express';
import { runQuery } from '../db/schema.js';
import { getAdminById } from '../auth/auth.js';

const router = express.Router();

interface TopLobby {
  id: string;
  name: string;
  participantCount: number;
}

interface TopAdmin {
  id: number;
  username: string;
  lobbyCount: number;
  totalParticipants: number;
}

interface SystemStats {
  totals: {
    admins: number;
    lobbies: number;
    participants: number;
  };
  topLobbies: TopLobby[];
  topAdmins: TopAdmin[];
}

router.get('/', async (req, res) => {
  // Check authentication
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check if user is "admin"
  const admin = await getAdminById(req.session.adminId);
  if (!admin || admin.username !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Get totals
    const adminCount = await runQuery<{ count: number }>('SELECT COUNT(*) as count FROM admins');
    const lobbyCount = await runQuery<{ count: number }>('SELECT COUNT(*) as count FROM lobbies');
    const participantCount = await runQuery<{ count: number }>('SELECT COUNT(*) as count FROM participants');

    // Get top 5 lobbies by participant count
    const topLobbiesRaw = await runQuery<{ id: string; name: string; participantCount: number }>(
      `SELECT l.id, l.name, COUNT(p.id) as participantCount
       FROM lobbies l
       LEFT JOIN participants p ON p.lobby_id = l.id
       GROUP BY l.id
       ORDER BY participantCount DESC
       LIMIT 5`
    );

    // Get top 5 admins by total participants across all their lobbies
    const topAdminsRaw = await runQuery<{ id: number; username: string; lobbyCount: number; totalParticipants: number }>(
      `SELECT a.id, a.username,
              COUNT(DISTINCT l.id) as lobbyCount,
              COUNT(p.id) as totalParticipants
       FROM admins a
       LEFT JOIN lobbies l ON l.admin_id = a.id
       LEFT JOIN participants p ON p.lobby_id = l.id
       GROUP BY a.id
       ORDER BY totalParticipants DESC
       LIMIT 5`
    );

    const stats: SystemStats = {
      totals: {
        admins: adminCount[0]?.count ?? 0,
        lobbies: lobbyCount[0]?.count ?? 0,
        participants: participantCount[0]?.count ?? 0,
      },
      topLobbies: topLobbiesRaw,
      topAdmins: topAdminsRaw,
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;
