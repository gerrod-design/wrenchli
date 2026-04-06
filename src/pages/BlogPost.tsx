import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { getPostBySlug } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import { CalendarDays, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <main className="section-padding bg-secondary min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-1 text-accent hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title={`${post.title} — Wrenchli Blog`} description={post.excerpt} path={`/blog/${slug}`} />

      <article className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl">
          {/* Back link */}
          <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>

          {/* Header */}
          <h1 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </span>
            <span>{post.author}</span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-a:text-accent hover:prose-a:underline">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
            <h3 className="font-heading text-lg font-semibold">
              Think your car has an issue?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Wrenchli's AI diagnoses your symptoms and connects you with trusted local shops — for free.
            </p>
            <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-white">
              <a href="https://wrenchli.net" target="_blank" rel="noopener noreferrer">
                Get your free symptom assessment <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
}
