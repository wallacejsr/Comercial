import { getApp } from "../server/app";

const app = getApp();

export default function handler(req: any, res: any) {
  // Delegate to the Express app instance
  return (app as any)(req, res);
}
