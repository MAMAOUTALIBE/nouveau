const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.MOCK_API_PORT || 8080);
const HOST = process.env.MOCK_API_HOST || '0.0.0.0';

const users = [
  {
    username: 'spruko@admin.com',
    password: 'sprukoadmin',
    fullName: 'Admin RH',
  },
];

const agents = [
  {
    id: 'PRM-0001',
    matricule: 'PRM-0001',
    fullName: 'Aminata Diallo',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    position: 'Chargee RH',
    status: 'Actif',
    manager: 'Directeur RH',
    email: 'aminata.diallo@gouv.gn',
    phone: '+224 620000001',
    photoUrl: './assets/images/faces/profile.jpg',
    careerEvents: [
      {
        title: 'Prise de fonction',
        description: 'Affectation initiale au service RH',
        date: '2024-01-15',
      },
    ],
    documents: [
      {
        type: 'Contrat',
        reference: 'CTR-2024-001',
        status: 'Valide',
      },
    ],
  },
  {
    id: 'PRM-0002',
    matricule: 'PRM-0002',
    fullName: 'Mamadou Camara',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    position: 'Assistant RH',
    status: 'Actif',
    manager: 'Aminata Diallo',
    email: 'mamadou.camara@gouv.gn',
    phone: '+224 620000002',
    photoUrl: './assets/images/faces/profile.jpg',
    careerEvents: [],
    documents: [],
  },
];

function nowToken(prefix) {
  return `${prefix}-${Date.now()}`;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

function findAgent(id) {
  return agents.find((a) => a.id === id);
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = normalizePath(url.pathname);

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (!path.startsWith('/api/v1')) {
    sendJson(res, 404, { message: 'Not Found' });
    return;
  }

  try {
    if (method === 'POST' && path === '/api/v1/auth/login') {
      const body = await readJsonBody(req);
      const username = String(body.username || body.email || '').trim();
      const password = String(body.password || '').trim();
      const user = users.find((u) => u.username === username && u.password === password);

      if (!user) {
        sendJson(res, 401, { message: 'Identifiants invalides' });
        return;
      }

      sendJson(res, 200, {
        accessToken: nowToken('mock-token'),
        refreshToken: nowToken('mock-refresh'),
        username: user.username,
        user: {
          username: user.username,
          email: user.username,
          fullName: user.fullName,
        },
      });
      return;
    }

    if (method === 'POST' && path === '/api/v1/auth/refresh') {
      const body = await readJsonBody(req);
      if (!body.refreshToken) {
        sendJson(res, 401, { message: 'Refresh token manquant' });
        return;
      }
      sendJson(res, 200, {
        accessToken: nowToken('mock-token'),
        refreshToken: nowToken('mock-refresh'),
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/dashboard/summary') {
      sendJson(res, 200, {
        headcount: 128,
        active: 117,
        absences: 11,
        vacancies: 6,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/dashboard/pending-requests') {
      sendJson(res, 200, [
        {
          reference: 'REQ-2026-001',
          agent: 'Aminata Diallo',
          type: 'Conge annuel',
          unit: 'Gestion administrative',
          submittedAt: '2026-03-20',
          status: 'En attente',
        },
      ]);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents') {
      sendJson(
        res,
        200,
        agents.map((a) => ({
          id: a.id,
          matricule: a.matricule,
          fullName: a.fullName,
          direction: a.direction,
          position: a.position,
          status: a.status,
          manager: a.manager,
        }))
      );
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/agents') {
      const body = await readJsonBody(req);
      const id = `PRM-${String(agents.length + 1).padStart(4, '0')}`;
      const created = {
        id,
        matricule: body.matricule || id,
        fullName: body.fullName || 'Nouvel agent',
        direction: body.direction || '',
        unit: body.unit || '',
        position: body.position || '',
        status: body.status || 'Actif',
        manager: body.manager || '',
        email: body.email || '',
        phone: body.phone || '',
        photoUrl: './assets/images/faces/profile.jpg',
        careerEvents: [],
        documents: [],
      };
      agents.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path.startsWith('/api/v1/personnel/agents/')) {
      const id = path.split('/').pop();
      const agent = findAgent(id);
      if (!agent) {
        sendJson(res, 404, { message: 'Agent introuvable' });
        return;
      }
      sendJson(res, 200, agent);
      return;
    }

    const emptyArrayEndpoints = new Set([
      '/api/v1/leave/requests',
      '/api/v1/leave/balances',
      '/api/v1/leave/events',
      '/api/v1/organization/units',
      '/api/v1/organization/positions/budgeted',
      '/api/v1/organization/positions/vacant',
      '/api/v1/recruitment/applications',
      '/api/v1/recruitment/campaigns',
      '/api/v1/recruitment/onboarding',
      '/api/v1/careers/movements',
      '/api/v1/performance/campaigns',
      '/api/v1/performance/results',
      '/api/v1/training/sessions',
      '/api/v1/training/catalog',
      '/api/v1/discipline/cases',
      '/api/v1/documents/library',
      '/api/v1/workflows/definitions',
      '/api/v1/workflows/instances',
      '/api/v1/admin/users',
      '/api/v1/admin/roles',
      '/api/v1/admin/audit-logs',
    ]);

    if (method === 'GET' && emptyArrayEndpoints.has(path)) {
      sendJson(res, 200, []);
      return;
    }

    sendJson(res, 404, { message: `Endpoint non implemente: ${method} ${path}` });
  } catch (error) {
    sendJson(res, 500, {
      message: 'Erreur mock backend',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[mock-api] listening on http://${HOST}:${PORT}`);
});
