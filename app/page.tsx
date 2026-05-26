import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-space-between align center">
      <h1 className="text-red-500">Hello this is BizSmart your Business Intelligence Software</h1>
      <Link href='/login' className="p-3 rounded bg-sky-600 text-white">Login</Link>
    </div>
  );
}
