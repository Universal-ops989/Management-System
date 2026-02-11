/**
 * Helper to build a MongoDB query and pagination options for user listing
 * Accepts query-like params (strings from req.query) and returns:
 * { query, skip, limit, sort, page }
 */
export function buildUserQueryOptions(params = {}) {
  const {
    search = '',
    group = '',
    degree = '',
    role = '',
    status = '',
    editor = undefined,
    createdFrom = '',
    createdTo = '',
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = params;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 10, 1000));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (search && String(search).trim() !== '') {
    const s = String(search).trim();
    query.$or = [
      { email: { $regex: s, $options: 'i' } },
      { name: { $regex: s, $options: 'i' } }
    ];
  }

  if (group) query.group = group;
  if (degree) query.degree = degree;
  if (role) query.role = role;
  if (status) query.status = status;

  if (editor !== undefined && editor !== '') {
    // Accept true/false or '1'/'0' strings
    if (typeof editor === 'string') {
      const v = editor.toLowerCase();
      if (v === 'true' || v === '1') query.editor = true;
      else if (v === 'false' || v === '0') query.editor = false;
    } else if (typeof editor === 'boolean') {
      query.editor = editor;
    }
  }

  if (createdFrom || createdTo) {
    query.createdAt = {};
    if (createdFrom) {
      const d = new Date(createdFrom);
      if (!isNaN(d)) query.createdAt.$gte = d;
    }
    if (createdTo) {
      const d = new Date(createdTo);
      if (!isNaN(d)) query.createdAt.$lte = d;
    }
    // if both parsed invalid, remove createdAt
    if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
  }

  const sort = {};
  const dir = (String(sortDir || 'desc').toLowerCase() === 'asc') ? 1 : -1;
  // allow sortBy of known fields; fall back to createdAt
  const allowedSort = ['createdAt', 'name', 'email', 'group', 'degree', 'role', 'status'];
  const sortKey = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  sort[sortKey] = dir;

  return {
    query,
    skip,
    limit: limitNum,
    sort,
    page: pageNum
  };
}

export default buildUserQueryOptions;
