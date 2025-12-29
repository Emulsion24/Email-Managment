import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>403 - Access Denied</h1>
      <p>You do not have permission to view the admin dashboard.</p>
      <Link href="/" className="text-blue-500 underline">Back to Login</Link>
    </div>
  );
}