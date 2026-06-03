TAG_VOCABULARY: dict[str, list[str]] = {
    "slow-burn": [
        "slow burn", "slow-burn", "takes a while to get going",
        "slow start", "builds slowly", "patient read", "slow paced",
        "slow to start", "doesn't pick up until",
    ],
    "fast-paced": [
        "fast paced", "fast-paced", "couldn't put it down", "page turner",
        "page-turner", "quick read", "flies by", "gripping from the start",
        "action packed", "non-stop",
    ],
    "non-linear": [
        "non-linear", "nonlinear", "told out of order", "jumps between timelines",
        "multiple timelines", "time jumps", "flashbacks",
    ],
    "episodic": [
        "episodic", "loosely connected", "anthology feel", "short stories",
        "collection of stories",
    ],

    "dark": [
        "dark", "darker", "darkest", "grim", "grimdark", "gritty",
        "bleak", "hopeless", "brutal", "disturbing", "harrowing",
        "heavy", "not for the faint", "trigger warning",
    ],
    "hopeful": [
        "hopeful", "uplifting", "optimistic", "feel good", "feel-good",
        "heartwarming", "life affirming", "life-affirming",
    ],
    "melancholic": [
        "melancholic", "melancholy", "bittersweet", "sad", "made me cry",
        "tear jerker", "tearjerker", "emotionally devastating",
        "beautifully sad", "wistful", "longing",
    ],
    "funny": [
        "funny", "hilarious", "laugh out loud", "laugh-out-loud", "witty",
        "humorous", "comedy", "comedic", "satirical", "satiric",
    ],
    "tense": [
        "tense", "suspenseful", "on the edge of my seat", "thriller-like",
        "gripping", "nail-biting", "kept me guessing",
    ],

    "morally-grey-protagonist": [
        "morally grey", "morally gray", "morally ambiguous", "antihero",
        "anti-hero", "not a good person", "flawed protagonist",
        "hard to root for", "complex protagonist", "villain protagonist",
        "unlikeable main character", "unlikable protagonist",
    ],
    "female-protagonist": [
        "female protagonist", "female lead", "woman protagonist",
        "girl protagonist", "heroine", "female main character",
    ],
    "ensemble-cast": [
        "ensemble", "multiple pov", "multiple point of view",
        "multiple perspectives", "large cast", "many characters",
        "rotating cast",
    ],
    "unreliable-narrator": [
        "unreliable narrator", "unreliable narration", "can't trust the narrator",
        "narrator is lying", "twist ending reveals", "not what it seems",
    ],

    "found-family": [
        "found family", "found-family", "ragtag group", "unlikely companions",
        "unlikely friends", "family you choose", "surrogate family",
    ],
    "colonialism": [
        "colonialism", "colonial", "imperialism", "imperialist",
        "occupation", "oppression", "systemic oppression",
    ],
    "political-intrigue": [
        "political intrigue", "politics", "political scheming",
        "court politics", "power struggle", "political thriller",
        "machinations",
    ],
    "coming-of-age": [
        "coming of age", "coming-of-age", "bildungsroman", "growing up",
        "loss of innocence", "teenage", "young adult themes", "growing pains",
    ],
    "grief": [
        "grief", "loss", "mourning", "death of a loved one", "coping with loss",
        "deals with death", "processing grief",
    ],
    "identity": [
        "identity", "self-discovery", "who am i", "sense of self",
        "finding yourself", "belonging",
    ],
    "power-and-corruption": [
        "power corrupts", "corruption", "absolute power", "tyrant",
        "tyranny", "abuse of power",
    ],
    "survival": [
        "survival", "fight to survive", "survivalist", "post-apocalyptic survival",
        "desert island", "stranded",
    ],
    "revenge": [
        "revenge", "vengeance", "vendetta", "getting back at",
        "quest for revenge",
    ],
    "love-story": [
        "romance", "love story", "romantic subplot", "falling in love",
        "relationship at the core",
    ],

    "hard-sci-fi": [
        "hard sci fi", "hard science fiction", "scientifically accurate",
        "realistic science", "physics", "engineering focused",
        "technical detail", "plausible future",
    ],
    "space-opera": [
        "space opera", "galaxy spanning", "intergalactic", "multiple planets",
        "space empire", "space war",
    ],
    "dystopian": [
        "dystopia", "dystopian", "totalitarian", "surveillance state",
        "oppressive regime", "post-apocalyptic society",
    ],
    "alien-contact": [
        "first contact", "alien contact", "meeting aliens", "extraterrestrial",
        "alien civilization",
    ],
    "time-travel": [
        "time travel", "time machine", "time loop", "going back in time",
        "paradox",
    ],

    "magic-system": [
        "magic system", "magic rules", "well defined magic",
        "hard magic", "soft magic", "interesting magic",
    ],
    "low-magic": [
        "low magic", "low fantasy", "little magic", "grounded fantasy",
        "not much magic",
    ],
    "high-fantasy": [
        "high fantasy", "epic fantasy", "world building", "intricate world",
        "detailed world",
    ],
    "mythology": [
        "mythology", "myth", "folklore", "legend", "mythological",
        "based on myth", "inspired by folklore",
    ],

    "lyrical-prose": [
        "lyrical", "beautiful prose", "gorgeous writing", "poetic",
        "literary fiction feel", "prose is stunning",
        "writing is beautiful", "reads like poetry",
    ],
    "dense": [
        "dense", "challenging read", "requires focus", "not easy reading",
        "heavy prose", "academic feel", "complex language", "difficult",
    ],
    "dialogue-driven": [
        "dialogue driven", "dialogue-driven", "lots of dialogue",
        "character interactions", "witty banter",
    ],
}

NEGATION_WORDS = {"not", "never", "barely", "hardly", "wasn't", "isn't",
                  "aren't", "doesn't", "don't", "no", "without", "lack"}

MOOD_KEYWORDS = {
    "dark", "darker", "grim", "bleak", "hopeless", "brutal",
    "funny", "hilarious", "witty", "comedic",
    "uplifting", "hopeful", "heartwarming",
    "tense", "gripping", "suspenseful",
    "slow", "slow-burn", "dense",
    "fast", "fast-paced", "quick",
    "emotional", "sad", "bittersweet",
}

LENGTH_KEYWORDS = {
    "short", "quick", "fast read", "under 300",
    "long", "epic", "massive", "doorstop",
}

GENRE_KEYWORDS = {
    "fantasy", "sci-fi", "science fiction", "horror", "thriller",
    "mystery", "romance", "historical", "literary", "non-fiction",
    "dystopian", "gothic", "crime", "adventure",
}
