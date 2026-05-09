import { Component, ReactNode } from "react";
import { Link } from "react-router-dom";

type S = { err?: Error };
export class ErrorBoundary extends Component<{ children: ReactNode }, S> {
  state: S = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) {
    if (typeof window !== "undefined") console.error("Kichana error:", err);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen grid place-items-center text-center p-6 bg-cream">
          <div className="max-w-sm">
            <div className="font-display text-5xl">Something tangled.</div>
            <p className="text-mute mt-3">Let's untangle it. Reload the page or head home — your data is safe.</p>
            <div className="mt-6 flex gap-2 justify-center">
              <button onClick={() => location.reload()} className="btn-primary">Reload</button>
              <Link to="/" className="btn-outline">Home</Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
