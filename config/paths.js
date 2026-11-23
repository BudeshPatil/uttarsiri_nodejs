import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** e3-nodejs project root */
export const ROOT_DIR = path.join(__dirname, '..');

/**
 * Public assets served at /public — inside e3-nodejs by default.
 * Override with PUBLIC_DIR when deploying elsewhere.
 */
export const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? path.resolve(ROOT_DIR, process.env.PUBLIC_DIR)
  : path.join(ROOT_DIR, 'public');

/** Uploaded media — defaults to PUBLIC_DIR/uploads */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(ROOT_DIR, process.env.UPLOAD_DIR)
  : path.join(PUBLIC_DIR, 'uploads');
