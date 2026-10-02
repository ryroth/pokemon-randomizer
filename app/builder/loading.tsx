export default function BuilderLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6">
      <p role="status" className="text-sm text-muted-foreground">
        Loading the builder…
      </p>
    </div>
  );
}
