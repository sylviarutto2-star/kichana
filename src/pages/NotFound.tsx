import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center p-6">
      <div>
        <div className="font-display text-7xl">404</div>
        <p className="text-mute mt-2">That page wandered off.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Take me home</Link>
      </div>
    </div>
  );
}
