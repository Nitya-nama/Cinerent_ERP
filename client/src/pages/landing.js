export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">

      {/* NAVBAR */}
      <header className="container-luxury flex justify-between items-center py-10">
        <div className="text-xs tracking-[0.35em] font-medium">
          CINERENT
        </div>

        <nav className="flex gap-14">
          <a className="nav-link">HOME</a>
          <a className="nav-link">ABOUT</a>
          <a className="nav-link">COLLECTION</a>
        </nav>

        <button className="border border-primary px-6 py-2 rounded-full text-xs">
          LOGIN
        </button>
      </header>

      {/* HERO */}
      <section className="text-center mt-24">
        <h1 className="hero-title">CINERENT</h1>

        <p className="text-secondary mt-6 text-sm">
          Elevate the shoot.
        </p>

        <div className="mt-24 flex justify-center">
          <div className="bg-surface rounded-full p-24">
            <img
              src="https://i.imgur.com/7QFQFQp.png"
              alt="camera"
              className="w-[420px]"
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container-luxury mt-48 text-center">
        <h2 className="section-title">ABOUT US</h2>
        <p className="section-sub">Sound in its purest state.</p>

        <div className="grid grid-cols-2 gap-24 mt-20 text-left">
          <p className="text-secondary leading-relaxed">
            CineRent is a professional film equipment rental platform
            designed for filmmakers, studios and creators.
          </p>

          <p className="text-secondary leading-relaxed">
            We combine premium cinema gear with intelligent booking,
            conflict detection and analytics.
          </p>
        </div>
      </section>
    </div>
  );
}
