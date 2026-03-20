const { useMemo, useState, useEffect } = React;
const data = window.SCENT_ID_DATA;

const icons = {
  Personalized: '✦',
  Educational: '◌',
  Sustainable: '↺',
  Emotional: '♡',
  Luxury: '◇',
};

const badgeClass =
  'inline-flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium tracking-[0.22em] text-stone uppercase';

function App() {
  const defaultFragrance = data.fragrances[0];
  const [currentView, setCurrentView] = useState('home');
  const [selectedFragrance, setSelectedFragrance] = useState(defaultFragrance);
  const [selectedMood, setSelectedMood] = useState(data.moods[0].name);
  const [quizStep, setQuizStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeToast, setActiveToast] = useState('');
  const [quizAnswers, setQuizAnswers] = useState(() =>
    data.quizQuestions.reduce((acc, question) => ({ ...acc, [question.id]: question.options[0] }), {})
  );
  const [scentResult, setScentResult] = useState(() => buildScentResult(quizAnswers));
  const [profileState, setProfileState] = useState(() => ({ ...data.profile }));

  useEffect(() => {
    if (!isGenerating) return undefined;
    const timer = window.setTimeout(() => {
      const result = buildScentResult(quizAnswers);
      setScentResult(result);
      setSelectedFragrance(result.recommendations[0]);
      setProfileState((prev) => ({ ...prev, scentId: result.title }));
      pushToast(`Your new SCENT ID is ${result.title}.`);
      setIsGenerating(false);
      setCurrentView('result');
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [isGenerating, quizAnswers]);

  useEffect(() => {
    if (!activeToast) return undefined;
    const timer = window.setTimeout(() => setActiveToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [activeToast]);

  const trending = useMemo(() => data.fragrances.slice(0, 6), []);
  const recommended = useMemo(() => scentResult.recommendations, [scentResult]);
  const activeMood = data.moods.find((mood) => mood.name === selectedMood) || data.moods[0];
  const moodFragrances = activeMood.fragranceIds.map((id) => data.fragrances.find((item) => item.id === id));
  const similarFragrances = data.fragrances
    .filter((item) => item.id !== selectedFragrance.id)
    .filter(
      (item) =>
        item.family.includes(selectedFragrance.family.split(' ')[0]) ||
        item.mood.some((m) => selectedFragrance.mood.includes(m))
    )
    .slice(0, 3);
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return data.fragrances
      .filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.family.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [searchTerm]);

  const pushToast = (message) => setActiveToast(message);

  const registerRecentlyViewed = (fragrance) => {
    const label = `${fragrance.brand} ${fragrance.name}`;
    setProfileState((prev) => ({
      ...prev,
      recentlyViewed: [label, ...prev.recentlyViewed.filter((item) => item !== label)].slice(0, 5),
    }));
  };

  const toggleFavorite = (fragranceName) => {
    setProfileState((prev) => {
      const exists = prev.saved.includes(fragranceName);
      const saved = exists
        ? prev.saved.filter((item) => item !== fragranceName)
        : [fragranceName, ...prev.saved].slice(0, 8);
      pushToast(exists ? `${fragranceName} removed from favorites.` : `${fragranceName} saved to your profile.`);
      return { ...prev, saved };
    });
  };

  const addWatchHistory = (label) => {
    setProfileState((prev) => ({
      ...prev,
      watchHistory: [label, ...prev.watchHistory.filter((item) => item !== label)].slice(0, 6),
    }));
    pushToast(`${label} added to watch history.`);
  };

  const placeKitOrder = () => {
    const orderLabel = `${data.discoveryKit.title} — Processing`;
    setProfileState((prev) => ({
      ...prev,
      orders: [orderLabel, ...prev.orders.filter((item) => item !== orderLabel)].slice(0, 4),
    }));
    pushToast('Your discovery kit was added to the dashboard.');
  };

  const openFragrance = (fragrance, nextView = 'detail') => {
    setSelectedFragrance(fragrance);
    registerRecentlyViewed(fragrance);
    setCurrentView(nextView);
  };

  const navAction = (view) => {
    if (view === 'detail' || view === 'lifestyle') {
      setSelectedFragrance(selectedFragrance || defaultFragrance);
    }
    setCurrentView(view);
  };

  const handleOptionSelect = (questionId, option) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const completeQuiz = () => {
    setIsGenerating(true);
  };

  return (
    <div className="min-h-screen bg-halo">
      <TopNav
        currentView={currentView}
        onNavigate={navAction}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        onOpenFragrance={openFragrance}
      />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        {currentView === 'home' && (
          <HomePage
            trending={trending}
            recommended={recommended}
            favorites={profileState.saved}
            onStartQuiz={() => setCurrentView('quiz')}
            onOpenFragrance={openFragrance}
            onOpenMood={(mood) => {
              setSelectedMood(mood);
              setCurrentView('moods');
            }}
            onLearn={() => setCurrentView('learn')}
            onGoToKit={() => setCurrentView('kit')}
          />
        )}

        {currentView === 'quiz' && (
          <QuizPage
            questions={data.quizQuestions}
            answers={quizAnswers}
            quizStep={quizStep}
            setQuizStep={setQuizStep}
            onSelect={handleOptionSelect}
            onComplete={completeQuiz}
            onReset={() => {
              setQuizStep(0);
              setQuizAnswers(data.quizQuestions.reduce((acc, question) => ({ ...acc, [question.id]: question.options[0] }), {}));
            }}
            isGenerating={isGenerating}
          />
        )}

        {currentView === 'result' && (
          <ResultPage
            result={scentResult}
            favorites={profileState.saved}
            onOpenFragrance={(fragrance) => openFragrance(fragrance, 'detail')}
            onSaveProfile={() => pushToast(`SCENT ID ${scentResult.title} saved to your dashboard.`)}
            onWatchReviews={() => {
              addWatchHistory(`Review roundup — ${scentResult.title}`);
              setCurrentView('community');
            }}
            onExploreKit={() => setCurrentView('kit')}
            onLearn={() => setCurrentView('learn')}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {currentView === 'detail' && (
          <DetailPage
            fragrance={selectedFragrance}
            similar={similarFragrances}
            favorites={profileState.saved}
            onOpenFragrance={openFragrance}
            onLifestyle={() => setCurrentView('lifestyle')}
            onToggleFavorite={toggleFavorite}
            onWatch={() => addWatchHistory(`${selectedFragrance.name} review`)}
          />
        )}

        {currentView === 'moods' && (
          <MoodPage
            activeMood={activeMood}
            moods={data.moods}
            fragrances={moodFragrances}
            favorites={profileState.saved}
            onSelectMood={setSelectedMood}
            onOpenFragrance={openFragrance}
          />
        )}

        {currentView === 'learn' && <LearnPage articles={data.articles} quickTips={data.quickTips} videos={data.videos} onWatch={addWatchHistory} />}

        {currentView === 'lifestyle' && <LifestylePage fragrance={selectedFragrance} onOpenKit={() => setCurrentView('kit')} />}

        {currentView === 'kit' && <DiscoveryKitPage kit={data.discoveryKit} result={scentResult} onOrder={placeKitOrder} />}

        {currentView === 'sustainability' && <SustainabilityPage />}

        {currentView === 'profile' && <ProfilePage profile={profileState} onNavigate={navAction} />}

        {currentView === 'community' && (
          <CommunityPage
            reviews={data.reviews}
            creatorReviews={data.creatorReviews}
            videos={data.videos}
            result={scentResult}
            onOpenFragrance={openFragrance}
            onWatch={addWatchHistory}
          />
        )}

        <Footer onNavigate={navAction} />
      </main>
      <MobileBottomNav currentView={currentView} onNavigate={navAction} />
      <Toast message={activeToast} />
    </div>
  );
}

function TopNav({ currentView, onNavigate, searchTerm, setSearchTerm, searchResults, onOpenFragrance }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button className="group text-left" onClick={() => onNavigate('home')}>
          <div className="text-[11px] uppercase tracking-[0.35em] text-gold">L'Oréal Luxe Prototype</div>
          <div className="font-display text-2xl tracking-[0.2em]">SCENT ID</div>
        </button>
        <nav className="hidden items-center gap-2 xl:flex">
          {data.navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                currentView === item.id ? 'bg-black text-white shadow-soft' : 'text-stone hover:bg-black/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative hidden min-w-[16rem] sm:block">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search fragrance, brand, family..."
              className="w-full rounded-full border border-black/10 bg-linen px-4 py-2.5 text-sm outline-none transition focus:border-gold/40 focus:bg-white"
            />
            {!!searchTerm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone">{searchResults.length}</div>
            )}
            {!!searchTerm && (
              <div className="absolute left-0 top-[calc(100%+0.75rem)] w-full overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-luxe">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onOpenFragrance(item);
                        setSearchTerm('');
                      }}
                      className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-linen"
                    >
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-2xl object-cover" />
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs uppercase tracking-[0.24em] text-gold">{item.brand}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-stone">No fragrance matches yet. Try YSL, Prada, floral, or woody.</div>
                )}
              </div>
            )}
          </div>
          <button className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold/20" onClick={() => onNavigate('quiz')}>
            Start your scent journey
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-3">
        <p className={badgeClass}>{eyebrow}</p>
        <h2 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h2>
        {copy && <p className="max-w-2xl text-base leading-7 text-stone sm:text-lg">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function HomePage({ trending, recommended, favorites, onStartQuiz, onOpenFragrance, onOpenMood, onLearn, onGoToKit }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-editorial p-6 shadow-luxe premium-card sm:p-10 lg:p-14 hero-glow">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className={badgeClass}>Luxury fragrance discovery</p>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
                Discover the fragrance that feels like you
              </h1>
              <p className="max-w-xl text-lg leading-8 text-stone">
                A premium fragrance platform where scent becomes identity—personalized recommendations, editorial learning, community reviews, discovery kits, and refill rituals in one polished experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5" onClick={onStartQuiz}>
                Start your scent journey
              </button>
              <button className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium transition hover:bg-black hover:text-white" onClick={() => onOpenMood('Elegant')}>
                Explore by mood
              </button>
            </div>
            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              {['AI-like personalization', 'Editorial learning', 'Refill-first luxury'].map((item) => (
                <div key={item} className="rounded-3xl border border-black/5 bg-white/70 px-4 py-4 text-sm text-stone shadow-soft">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <img
              className="float-card h-[22rem] w-full rounded-[2rem] object-cover shadow-luxe sm:h-[28rem]"
              src="https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80"
              alt="Luxury perfume bottles arranged editorially"
            />
            <div className="gold-ring rounded-[2rem] border border-gold/20 bg-white/80 p-5 sm:max-w-sm lg:max-w-none">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Signature insight</p>
              <h3 className="mt-3 font-display text-3xl">Perfume as identity</h3>
              <p className="mt-3 text-sm leading-7 text-stone">
                Match fragrance to mood, music, film, destination, and style—because how you smell shapes how you are remembered.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatSpotlight label="Saved perfumes" value={favorites.length} copy="Curations that are starting to feel like you." />
        <StatSpotlight label="Discovery moods" value={data.moods.length} copy="Browse scent through emotion, lifestyle, and atmosphere." />
        <StatSpotlight label="Luxury lessons" value={data.articles.length} copy="Editorial learning that makes perfumery easier to read." />
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
        <SectionHeader
          eyebrow="Trending now"
          title="Fragrances everyone is talking about"
          copy="Swipe-worthy signatures with strong community love, premium storytelling, and mood-rich positioning."
        />
        <div className="fade-mask -mx-2 overflow-x-auto px-2 pb-2">
          <div className="flex gap-4">
            {trending.map((fragrance) => (
              <FragranceCard key={fragrance.id} fragrance={fragrance} compact onClick={() => onOpenFragrance(fragrance)} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader
            eyebrow="Recommended for you"
            title="Your evolving fragrance lineup"
            copy="Curated from your SCENT ID with balanced freshness, warmth, and a polished luxury finish."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recommended.map((fragrance) => (
              <FragranceCard key={fragrance.id} fragrance={fragrance} onClick={() => onOpenFragrance(fragrance)} />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
            <SectionHeader eyebrow="Explore by mood" title="Choose how you want to feel" />
            <div className="grid gap-4 sm:grid-cols-2">
              {data.moods.slice(0, 6).map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => onOpenMood(mood.name)}
                  className="group relative overflow-hidden rounded-[1.6rem] text-left shadow-soft transition hover:-translate-y-1"
                >
                  <img src={mood.image} alt={mood.name} className="h-40 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="text-xs uppercase tracking-[0.32em] text-white/70">Mood edit</div>
                    <div className="mt-2 font-display text-2xl">{mood.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
            <SectionHeader eyebrow="Learn perfumery" title="Luxury education, made intuitive" copy="Understand notes, concentration, layering, and skin chemistry with editorial visuals and quick tips." />
            <button className="rounded-full border border-black/10 bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-black" onClick={onLearn}>
              Enter the learning suite
            </button>
          </section>
        </div>
      </section>

      <section className="rounded-[2rem] border border-gold/20 bg-gradient-to-r from-[#181512] via-[#2a241c] to-[#181512] p-6 text-white shadow-luxe sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-gold/80">Luxury discovery kits</p>
            <h2 className="font-display text-4xl">Try beautifully before you commit</h2>
            <p className="text-sm leading-7 text-white/75 sm:text-base">
              Build confidence with curated miniatures, refill-forward storytelling, and a lower-risk path to your next full-size signature.
            </p>
          </div>
          <button className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gold/90" onClick={onGoToKit}>
            Curate my kit
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
        <SectionHeader eyebrow="Why SCENT ID?" title="A luxury beauty-tech experience with emotional intelligence" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.whyItems.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-black/5 bg-linen p-5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-lg text-gold">
                {icons[item.title]}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuizPage({ questions, answers, quizStep, setQuizStep, onSelect, onComplete, onReset, isGenerating }) {
  const question = questions[quizStep];
  const progress = Math.round(((quizStep + 1) / questions.length) * 100);

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-10">
      <SectionHeader eyebrow="Onboarding / Scent Quiz" title="Build your fragrance profile" copy="Elegant, card-based prompts designed to feel personal, visual, and premium from first tap to final reveal." />
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[1.8rem] border border-black/5 bg-linen p-6">
          <div className="flex items-center justify-between text-sm text-stone">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-6 space-y-3">
            {questions.map((item, index) => (
              <button
                key={item.id}
                onClick={() => !isGenerating && setQuizStep(index)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                  index === quizStep ? 'bg-black text-white' : 'bg-white text-stone hover:bg-black/5'
                }`}
              >
                <span className="text-sm">{item.title}</span>
                <span className="text-base">{item.icon}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-[1.4rem] bg-white p-4 text-sm leading-7 text-stone">
            <div className="mb-2 text-xs uppercase tracking-[0.26em] text-gold">Current selections</div>
            {questions.slice(0, quizStep + 1).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b border-black/5 py-2 last:border-b-0">
                <span>{item.title}</span>
                <span className="font-medium text-ink">{answers[item.id]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-gold/20 bg-editorial p-6 sm:p-8">
          {!isGenerating ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gold">Question {quizStep + 1}</p>
                  <h3 className="mt-3 font-display text-4xl">{question.title}</h3>
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-soft">{question.icon}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => onSelect(question.id, option)}
                      className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-1 ${
                        selected ? 'border-black bg-black text-white shadow-soft' : 'border-black/8 bg-white text-ink hover:border-gold/50'
                      }`}
                    >
                      <div className="text-xs uppercase tracking-[0.25em] text-gold/80">Select</div>
                      <div className="mt-3 text-lg font-medium">{option}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setQuizStep((step) => Math.max(step - 1, 0))}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium transition hover:bg-black/5"
                  disabled={quizStep === 0}
                >
                  Previous
                </button>
                <button className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium transition hover:bg-black/5" onClick={onReset}>
                  Reset answers
                </button>
                {quizStep < questions.length - 1 ? (
                  <button
                    onClick={() => setQuizStep((step) => Math.min(step + 1, questions.length - 1))}
                    className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-black"
                  >
                    Continue
                  </button>
                ) : (
                  <button onClick={onComplete} className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-black">
                    Reveal my SCENT ID
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
              <div className="quiz-loader h-24 w-24 rounded-full border border-gold/20" />
              <p className="mt-8 text-xs uppercase tracking-[0.35em] text-gold">Generating your SCENT ID...</p>
              <h3 className="mt-4 font-display text-4xl">Composing your luxury scent profile</h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-stone">
                We are blending your mood, aesthetic, climate, and fragrance family affinities into a signature profile with premium recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultPage({ result, favorites, onOpenFragrance, onSaveProfile, onWatchReviews, onExploreKit, onLearn, onToggleFavorite }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-editorial p-6 shadow-luxe sm:p-10">
        <SectionHeader eyebrow="SCENT ID result" title={`Your SCENT ID: “${result.title}”`} copy={result.explainer} />
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">Profile card</p>
            <h3 className="mt-4 font-display text-4xl">{result.title}</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-sm text-ink">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] bg-linen p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Suggested olfactive profile</p>
              <p className="mt-3 text-lg font-medium text-ink">{result.profile}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ActionButton label="Save profile" onClick={onSaveProfile} />
              <ActionButton label="Watch reviews" onClick={onWatchReviews} />
              <ActionButton label="Explore discovery kit" onClick={onExploreKit} />
              <ActionButton label="Learn the notes" onClick={onLearn} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Why this matches you</p>
              <p className="mt-4 text-base leading-8 text-stone">{result.matchWhy}</p>
            </div>
            <div className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Your scent mood board</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {result.moodBoard.map((item) => (
                  <div key={item.label} className="overflow-hidden rounded-[1.4rem] bg-linen">
                    <img src={item.image} alt={item.label} className="h-36 w-full object-cover" />
                    <div className="p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-gold">{item.label}</div>
                      <div className="mt-2 text-sm text-stone">{item.caption}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
        <SectionHeader eyebrow="Recommended fragrances" title="A refined lineup for your profile" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {result.recommendations.map((fragrance) => (
            <FragranceCard
              key={fragrance.id}
              fragrance={fragrance}
              onClick={() => onOpenFragrance(fragrance)}
              extraAction={
                <MiniToggle
                  active={favorites.includes(fragrance.name)}
                  label={favorites.includes(fragrance.name) ? 'Saved' : 'Save'}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(fragrance.name);
                  }}
                />
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function DetailPage({ fragrance, similar, favorites, onOpenFragrance, onLifestyle, onToggleFavorite, onWatch }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-10">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <img src={fragrance.image} alt={fragrance.name} className="h-[28rem] w-full rounded-[2rem] object-cover shadow-soft sm:h-[34rem]" />
          <div className="space-y-6">
            <div>
              <p className={badgeClass}>Fragrance detail</p>
              <h1 className="mt-4 font-display text-5xl">{fragrance.name}</h1>
              <div className="mt-2 text-lg text-stone">{fragrance.brand} · {fragrance.type}</div>
            </div>
            <p className="max-w-2xl text-base leading-8 text-stone">{fragrance.description}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <PyramidCard title="Top notes" notes={fragrance.top} />
              <PyramidCard title="Heart notes" notes={fragrance.heart} />
              <PyramidCard title="Base notes" notes={fragrance.base} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard label="Match score" value={`${fragrance.score}%`} />
              <StatCard label="Community rating" value={`${fragrance.rating} / 5`} />
            </div>
            <TagSection title="Mood tags" tags={fragrance.mood} />
            <TagSection title="Best for" tags={fragrance.style} />
            <div className="rounded-[1.5rem] border border-black/5 bg-linen p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-gold">Review snippets</p>
              <div className="mt-3 space-y-2">
                {fragrance.reviewSnippets.map((review) => (
                  <p key={review} className="text-sm leading-7 text-stone">“{review}”</p>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton label="This fragrance feels like…" onClick={onLifestyle} />
              <ActionButton label="Watch reviews" onClick={onWatch} />
              <ActionButton label={favorites.includes(fragrance.name) ? 'Saved to profile' : 'Save to profile'} onClick={() => onToggleFavorite(fragrance.name)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader eyebrow="Video review" title="Watch the fragrance conversation" copy="A premium video area for creator reviews, wear tests, and note breakdowns." />
          <div className="overflow-hidden rounded-[1.8rem] border border-black/5 bg-black shadow-soft">
            <iframe
              className="aspect-video w-full"
              src={fragrance.video}
              title={`${fragrance.name} review video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader eyebrow="You may also like" title="If you love this scent, explore next" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            {similar.map((item) => (
              <FragranceCard key={item.id} fragrance={item} compact onClick={() => onOpenFragrance(item)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MoodPage({ activeMood, moods, fragrances, favorites, onSelectMood, onOpenFragrance }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-8">
        <SectionHeader eyebrow="Discover by mood" title={`${activeMood.name} fragrance edit`} copy="Browse fragrances through emotional and lifestyle lenses—clean, seductive, elegant, cozy, cinematic, and beyond." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {moods.map((mood) => (
            <button
              key={mood.name}
              onClick={() => onSelectMood(mood.name)}
              className={`rounded-full px-4 py-3 text-sm transition ${
                activeMood.name === mood.name ? 'bg-black text-white' : 'bg-linen text-stone hover:bg-black/5'
              }`}
            >
              {mood.name}
            </button>
          ))}
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fragrances.length ? (
          fragrances.map((fragrance) => (
            <FragranceCard
              key={fragrance.id}
              fragrance={fragrance}
              onClick={() => onOpenFragrance(fragrance)}
              extraAction={<span className="rounded-full bg-linen px-3 py-1 text-xs text-stone">{favorites.includes(fragrance.name) ? 'In favorites' : 'Mood match'}</span>}
            />
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-10 text-sm text-stone">No mood matches yet. Try another lens.</div>
        )}
      </div>
    </div>
  );
}

function LearnPage({ articles, quickTips, videos, onWatch }) {
  const [selectedArticle, setSelectedArticle] = useState(articles[0]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-editorial p-6 shadow-luxe sm:p-10">
        <SectionHeader eyebrow="Learn perfumery" title="Editorial fragrance education" copy="An elegant learning hub covering the fundamentals of notes, olfactive families, concentration, layering, longevity, and the chemistry of skin." />
        <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-3">
            {articles.map((article) => (
              <button
                key={article.title}
                onClick={() => setSelectedArticle(article)}
                className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                  selectedArticle.title === article.title ? 'border-black bg-black text-white' : 'border-black/5 bg-white hover:border-gold/30'
                }`}
              >
                <div className="text-xs uppercase tracking-[0.25em] text-gold/80">Guide</div>
                <div className="mt-2 text-lg font-medium">{article.title}</div>
              </button>
            ))}
          </div>
          <article className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Featured article</p>
            <h3 className="mt-3 font-display text-4xl leading-tight">{selectedArticle.title}</h3>
            <p className="mt-5 text-base leading-8 text-stone">{selectedArticle.body}</p>
            <div className="mt-6 rounded-[1.5rem] bg-linen p-5 text-sm leading-7 text-stone">
              Premium tip: treat perfume like wardrobe styling—start with structure, then add texture and memory.
            </div>
          </article>
        </div>
      </section>
      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader eyebrow="Quick tips" title="Small rituals, better wear" />
          <div className="space-y-4">
            {quickTips.map((tip, index) => (
              <div key={tip} className="flex gap-4 rounded-[1.4rem] bg-linen p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold shadow-soft">0{index + 1}</div>
                <p className="text-sm leading-7 text-stone">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader eyebrow="Watch and learn" title="Video essentials" />
          <div className="grid gap-4">
            {videos.map((video) => (
              <button key={video.title} className="grid gap-4 rounded-[1.5rem] border border-black/5 p-4 text-left transition hover:bg-linen sm:grid-cols-[180px_1fr]" onClick={() => onWatch(video.title)}>
                <img src={video.cover} alt={video.title} className="h-40 w-full rounded-[1.2rem] object-cover sm:h-full" />
                <div className="flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">{video.creator}</p>
                  <h3 className="mt-2 font-display text-3xl">{video.title}</h3>
                  <p className="mt-2 text-sm text-stone">{video.length}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LifestylePage({ fragrance, onOpenKit }) {
  const lifestyle = fragrance.lifestyle;
  const cards = [
    { label: 'Movie', value: lifestyle.movie },
    { label: 'Music vibe', value: lifestyle.music },
    { label: 'Food or drink', value: lifestyle.drink },
    { label: 'Destination', value: lifestyle.destination },
    { label: 'Fashion aesthetic', value: lifestyle.fashion },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-editorial p-6 shadow-luxe sm:p-10">
        <SectionHeader eyebrow="Lifestyle match" title={`This fragrance feels like ${fragrance.name}`} copy="An emotional recommendation engine linking perfume to the worlds you want to inhabit—cinema, playlists, food, destinations, and fashion moods." />
        <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
          <img src={fragrance.image} alt={fragrance.name} className="h-[28rem] w-full rounded-[2rem] object-cover shadow-soft" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">{card.label}</p>
                <p className="mt-3 font-display text-3xl leading-tight">{card.value}</p>
              </div>
            ))}
            <div className="rounded-[1.5rem] border border-gold/20 bg-black p-6 text-white shadow-soft md:col-span-2 xl:col-span-3">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Next step</p>
              <h3 className="mt-3 font-display text-4xl">Turn inspiration into discovery</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Translate this emotional profile into a wearable wardrobe with a discovery edit built around your SCENT ID and compatible moods.
              </p>
              <button className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gold hover:text-black" onClick={onOpenKit}>
                Explore discovery kit
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DiscoveryKitPage({ kit, result, onOrder }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-10">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <img src={kit.image} alt={kit.title} className="h-[28rem] w-full rounded-[2rem] object-cover shadow-soft sm:h-[34rem]" />
          <div className="space-y-6">
            <div>
              <p className={badgeClass}>Discovery kit</p>
              <h1 className="mt-4 font-display text-5xl">{kit.title}</h1>
              <p className="mt-4 text-base leading-8 text-stone">{kit.description}</p>
            </div>
            <div className="rounded-[1.5rem] bg-linen p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Why it’s perfect for you</p>
              <p className="mt-3 text-sm leading-7 text-stone">
                Built around your current SCENT ID, {result.title}, this edit balances elegant woods, radiant florals, clean musks, and one warm wildcard for discovery.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-black/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">What’s inside</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-stone">
                  {kit.contents.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.5rem] border border-black/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Benefits</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-stone">
                  {kit.benefits.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-gold/20 bg-gold/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Sustainability message</p>
              <p className="mt-3 text-sm leading-7 text-stone">{kit.sustainability}</p>
            </div>
            <ActionButton label="Order your kit" primary onClick={onOrder} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SustainabilityPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-editorial p-6 shadow-luxe sm:p-10">
        <SectionHeader eyebrow="Refill & sustainability" title="Luxury that lasts beyond the first bottle" copy="A premium page explaining refill systems, reduced waste, and the long-term relationship between identity and fragrance." />
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-5 md:grid-cols-2">
            {data.sustainabilityCards.map((section) => (
              <div key={section.title} className="rounded-[1.6rem] border border-black/5 bg-white p-6 shadow-soft">
                <h3 className="font-display text-3xl">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone">{section.copy}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-soft">
            <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" alt="Luxury refill ritual visual" className="h-72 w-full object-cover" />
            <div className="p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Refill ritual</p>
              <h3 className="mt-3 font-display text-4xl">A smarter bottle journey</h3>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone">
                {data.refillSteps.map((step) => (
                  <div key={step}>• {step}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfilePage({ profile, onNavigate }) {
  const groups = [
    ['Saved perfumes', profile.saved],
    ['Watch history', profile.watchHistory],
    ['Favorite moods', profile.favoriteMoods],
    ['Discovery kit orders', profile.orders],
    ['Refill reminders', profile.refillReminders],
    ['Recently viewed fragrances', profile.recentlyViewed],
    ['Recommended next scents', profile.recommendedNext],
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className={badgeClass}>Profile / dashboard</p>
            <h1 className="mt-4 font-display text-5xl">{profile.name}</h1>
            <p className="mt-3 text-lg text-stone">SCENT ID profile: {profile.scentId}</p>
          </div>
          <div className="rounded-[1.8rem] bg-editorial p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Premium note</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-stone">
              Your dashboard brings together saved fragrances, education, discovery kits, refill reminders, and next-best scent suggestions in one calm luxury space.
            </p>
            <button className="mt-4 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-black" onClick={() => onNavigate('quiz')}>
              Refresh my SCENT ID
            </button>
          </div>
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map(([title, items]) => (
          <div key={title} className="rounded-[1.6rem] border border-black/5 bg-white p-6 shadow-soft">
            <h3 className="font-display text-3xl">{title}</h3>
            {items.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone">
                {items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-[1.2rem] bg-linen p-4 text-sm text-stone">Nothing here yet—your next discovery will appear soon.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityPage({ reviews, creatorReviews, videos, result, onOpenFragrance, onWatch }) {
  const similarLove = result.recommendations.slice(0, 3);
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-luxe sm:p-10">
        <SectionHeader eyebrow="Community" title="Reviews, ratings, and creator opinions" copy="A clean social layer featuring user voices, star ratings, fragrance snippets, and video reviews tailored to your SCENT ID." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review) => (
            <div key={review.name} className="rounded-[1.5rem] border border-black/5 bg-linen p-5">
              <div className="text-sm font-semibold">{review.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.25em] text-gold">{review.scentId}</div>
              <div className="mt-3 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              <p className="mt-3 text-sm leading-7 text-stone">{review.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
          <SectionHeader eyebrow="People with a similar SCENT ID also loved…" title="Community favorites" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            {similarLove.map((fragrance) => (
              <FragranceCard key={fragrance.id} fragrance={fragrance} compact onClick={() => onOpenFragrance(fragrance)} />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
            <SectionHeader eyebrow="Creator review grid" title="Watch premium takes" />
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((video) => (
                <button key={video.title} className="overflow-hidden rounded-[1.4rem] border border-black/5 bg-linen text-left transition hover:-translate-y-0.5" onClick={() => onWatch(video.title)}>
                  <img src={video.cover} alt={video.title} className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-gold">{video.creator}</div>
                    <h3 className="mt-2 text-lg font-semibold">{video.title}</h3>
                    <div className="mt-2 text-sm text-stone">{video.length}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft sm:p-8">
            <SectionHeader eyebrow="Creator cards" title="Luxury voices" />
            <div className="grid gap-4 md:grid-cols-2">
              {creatorReviews.map((creator) => (
                <div key={creator.name} className="rounded-[1.5rem] bg-linen p-4">
                  <div className="flex items-center gap-4">
                    <img src={creator.image} alt={creator.name} className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-xs uppercase tracking-[0.24em] text-gold">{creator.specialty}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone">{creator.quote}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FragranceCard({ fragrance, onClick, compact = false, extraAction = null }) {
  return (
    <button
      onClick={onClick}
      className={`group overflow-hidden rounded-[1.8rem] border border-black/5 bg-white text-left shadow-soft transition hover:-translate-y-1 hover:shadow-luxe ${
        compact ? 'min-w-[18rem] max-w-[18rem]' : 'w-full'
      }`}
    >
      <img src={fragrance.image} alt={fragrance.name} className={`${compact ? 'h-52' : 'h-64'} w-full object-cover`} />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">{fragrance.brand}</p>
          <h3 className="mt-2 font-display text-3xl leading-tight">{fragrance.name}</h3>
          <p className="mt-2 text-sm text-stone">{fragrance.family}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fragrance.mood.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-linen px-3 py-1 text-xs text-stone">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-stone">
          <span>{fragrance.score}% match</span>
          <span>{fragrance.rating} ★</span>
        </div>
        {extraAction && <div>{extraAction}</div>}
      </div>
    </button>
  );
}

function PyramidCard({ title, notes }) {
  return (
    <div className="rounded-[1.4rem] bg-linen p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{title}</p>
      <p className="mt-3 text-sm leading-7 text-stone">{notes.join(' · ')}</p>
    </div>
  );
}

function TagSection({ title, tags }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-stone">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function StatSpotlight({ label, value, copy }) {
  return (
    <div className="rounded-[1.6rem] border border-black/5 bg-white p-6 shadow-soft">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{label}</p>
      <div className="mt-2 font-display text-5xl">{value}</div>
      <p className="mt-2 text-sm leading-7 text-stone">{copy}</p>
    </div>
  );
}

function ActionButton({ label, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5 ${
        primary ? 'bg-black text-white hover:bg-gold hover:text-black' : 'border border-black/10 bg-white hover:bg-black hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function MiniToggle({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? 'bg-black text-white' : 'bg-linen text-stone hover:bg-black hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function MobileBottomNav({ currentView, onNavigate }) {
  const mobileItems = data.navItems.filter((item) => ['home', 'quiz', 'moods', 'profile', 'community'].includes(item.id));
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        {mobileItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
              currentView === item.id ? 'bg-black text-white' : 'bg-linen text-stone'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="mt-12 rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-soft sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">SCENT ID</p>
          <h2 className="mt-3 font-display text-3xl">Luxury fragrance discovery, made demo-ready.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
            Explore recommendations, perfumery learning, creator reviews, refill rituals, and a premium fragrance dashboard in one cohesive prototype.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {['learn', 'kit', 'sustainability', 'community'].map((view) => (
            <button key={view} onClick={() => onNavigate(view)} className="rounded-full bg-linen px-4 py-2 text-sm text-stone transition hover:bg-black hover:text-white">
              {view === 'kit' ? 'Discovery kit' : view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Toast({ message }) {
  return (
    <div className={`fixed right-4 top-24 z-[60] max-w-xs rounded-2xl bg-black px-4 py-3 text-sm text-white shadow-luxe transition ${message ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
      {message}
    </div>
  );
}

function buildScentResult(answers) {
  const titleMap = {
    Elegant: 'Elegant Woody Glow',
    Fresh: 'Clean Citrus Veil',
    Bold: 'Bold Mineral Night',
    Sensual: 'Velvet Floral Aura',
    Creative: 'Modern Amber Muse',
  };

  const profileMap = {
    Citrus: 'Sparkling citrus top · transparent floral heart · soft musk base',
    Floral: 'Radiant fresh top · floral heart · woody amber base',
    Woody: 'Fresh top · floral heart · woody amber base',
    Amber: 'Luminous top · creamy floral heart · amber resin base',
    Gourmand: 'Velvet fruit top · airy floral heart · gourmand woods base',
    Musk: 'Aldehydic top · skin-musk heart · clean woods base',
    Aquatic: 'Marine citrus top · mineral heart · musk cedar base',
  };

  const family = answers.family;
  const title = titleMap[answers.style] || 'Elegant Woody Glow';
  const tags = [answers.energy, answers.style, answers.aesthetic].slice(0, 4);
  const profile = profileMap[family] || profileMap.Woody;

  const recommendationRules = [
    { match: (f) => f.brand === answers.brand },
    { match: (f) => f.family.toLowerCase().includes(family.toLowerCase()) },
    { match: (f) => f.mood.includes(energyToMood(answers.energy)) },
    { match: (f) => f.style.some((item) => item.toLowerCase().includes(occasionToStyle(answers.occasion))) },
    { match: (f) => f.mood.includes(aestheticToMood(answers.aesthetic)) },
  ];

  const chosen = [];
  recommendationRules.forEach((rule) => {
    data.fragrances.forEach((fragrance) => {
      if (rule.match(fragrance) && !chosen.find((item) => item.id === fragrance.id) && chosen.length < 4) {
        chosen.push(fragrance);
      }
    });
  });

  data.fragrances.forEach((fragrance) => {
    if (!chosen.find((item) => item.id === fragrance.id) && chosen.length < 4) {
      chosen.push(fragrance);
    }
  });

  return {
    title,
    tags,
    profile,
    explainer: 'A signature profile shaped by your style, climate, emotional energy, and fragrance-family preferences.',
    matchWhy: `You selected ${answers.style.toLowerCase()} style, ${answers.energy.toLowerCase()} energy, ${answers.family.toLowerCase()} notes, and a ${answers.aesthetic.toLowerCase()} aesthetic. The result balances elegance with emotional resonance, combining clarity in the opening with a richer, memorable dry-down.`,
    moodBoard: [
      {
        label: 'Style cue',
        caption: answers.aesthetic,
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      },
      {
        label: 'Energy',
        caption: answers.energy,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      },
      {
        label: 'Climate lens',
        caption: answers.climate,
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      },
    ],
    recommendations: chosen,
  };
}

function energyToMood(energy) {
  const map = {
    Calm: 'Clean',
    Powerful: 'Powerful',
    Romantic: 'Dreamy',
    Sophisticated: 'Elegant',
    Playful: 'Creative',
  };
  return map[energy] || 'Elegant';
}

function aestheticToMood(aesthetic) {
  const map = {
    'Clean girl': 'Clean',
    'Old money': 'Elegant',
    'Dark academia': 'Dreamy',
    'Soft luxury': 'Cozy',
    'Main character': 'Night out',
    'Minimal chic': 'Creative',
  };
  return map[aesthetic] || 'Elegant';
}

function occasionToStyle(occasion) {
  const map = {
    Daily: 'daily',
    Work: 'work',
    'Date night': 'night',
    Events: 'events',
    'Relaxing at home': 'home',
  };
  return map[occasion] || 'daily';
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
