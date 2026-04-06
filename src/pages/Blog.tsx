import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { getAllPosts } from "@/lib/blog";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";

export default function Blog() {
  const posts = getAllPosts();

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Blog — Wrenchli"
        description="Vehicle repair insights, diagnostic tips, and industry guides from the Wrenchli team."
        path="/blog"
      />

      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            Wrenchli Blog
          </h1>
          <p className="mt-2 text-muted-foreground">
            Repair tips, diagnostic guides, and industry insights.
          </p>

          <div className="mt-10 space-y-8">
            {posts.length === 0 && (
              <p className="text-muted-foreground">No articles yet — check back soon.</p>
            )}

            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-xl border border-border/50 bg-card p-6 transition-shadow hover:shadow-md"
              >
                <Link to={`/blog/${post.slug}`} className="group">
                  <h2 className="font-heading text-xl font-semibold group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTime} min read
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Read more <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
