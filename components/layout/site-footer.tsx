export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-1 px-[var(--space-page-x)] py-6 text-sm text-muted-foreground">
        <p>Pokémon and Pokémon character names are trademarks of Nintendo.</p>
        <p>This fan project is not affiliated with Nintendo, Game Freak, or The Pokémon Company.</p>
        <p>
          Page backdrops are official art and screenshots from Pokémon Legends: Z-A and Pokémon Scarlet and
          Violet. © Nintendo, Creatures Inc., GAME FREAK inc.
        </p>
      </div>
    </footer>
  );
}
