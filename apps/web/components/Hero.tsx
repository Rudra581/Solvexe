import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
          Welcome to Solvex
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          The definitive platform for algorithmic challenges. Compete in contests, master complex problems, and climb the global leaderboards.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/contests"
            className="inline-flex h-12 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-900/90 focus:outline-none focus:ring-2 focus:ring-gray-950 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90"
            prefetch={false}
          >
            View Contests
          </Link>
          <Link
            href="/problems"
            className="inline-flex h-12 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 dark:hover:bg-gray-800"
            prefetch={false}
          >
            Solve Problems
          </Link>
        </div>
      </div>
    </section>
  );
}
