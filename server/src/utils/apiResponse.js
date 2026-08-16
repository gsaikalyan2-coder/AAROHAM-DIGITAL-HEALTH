/** Every response in this API uses one of these two shapes. No exceptions. */
export const ok = (res, data = {}, message = '') =>
  res.json({ success: true, data, message });

export const created = (res, data = {}, message = '') =>
  res.status(201).json({ success: true, data, message });

export const fail = (res, status, code, message, details = []) =>
  res.status(status).json({ success: false, error: { code, message, details } });
