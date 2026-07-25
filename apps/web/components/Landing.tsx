import { Contests } from "./Contests";
import { Hero } from "./Hero";
import { Problems } from "./Problems";

export function Landing() {
  return (
    <div className="w-full">
      <main className="w-full">
        <Hero />
        <Contests />
        <section className="bg-white dark:bg-gray-900 py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-6">
            <Problems />
          </div>
        </section>
      </main>
    </div>
  );
}
