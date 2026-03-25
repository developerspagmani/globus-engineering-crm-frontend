import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-wrapper flex-column text-center">
      <div className="mb-4">
        <h1 className="fw-bold text-primary display-4">Globus CRM</h1>
        <p className="lead text-muted">Advanced Engineering CRM Solution</p>
      </div>
      <div className="d-flex gap-3">
        <Link href="/login" className="btn btn-primary btn-lg px-5">
          Go to Admin Panel
        </Link>
      </div>
    </div>
  );
}
