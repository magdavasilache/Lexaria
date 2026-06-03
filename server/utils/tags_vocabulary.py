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

TAG_VOCABULARY.update({
    "cozy": [
        "cozy", "cosy", "comfort read", "warm hug", "wholesome",
        "gentle", "low stakes", "cozy fantasy", "slice of life",
        "soft", "comforting", "peaceful", "charming",
    ],

    "grimdark": [
        "grimdark", "extremely dark", "nihilistic", "relentless",
        "everyone suffers", "no happy endings", "morally bankrupt world",
        "violent and bleak",
    ],

    "gothic": [
        "gothic", "gothic horror", "haunted mansion", "decaying estate",
        "atmospheric", "brooding", "victorian feel", "eerie atmosphere",
        "dark romance", "ominous",
    ],

    "horror": [
        "horror", "terrifying", "scary", "creepy", "nightmarish",
        "spine chilling", "spine-chilling", "unsettling",
        "frightening", "horror elements", "haunting",
    ],

    "body-horror": [
        "body horror", "grotesque transformation", "disturbing body changes",
        "flesh horror", "physical horror",
    ],

    "psychological": [
        "psychological", "mind bending", "mind-bending",
        "psychological horror", "psychological thriller",
        "gets inside your head", "mental breakdown",
    ],

    "mystery": [
        "mystery", "whodunit", "who done it", "investigation",
        "detective story", "murder mystery", "crime mystery",
    ],

    "thriller": [
        "thriller", "high stakes", "race against time",
        "kept me turning pages", "adrenaline filled",
    ],

    "literary": [
        "literary", "literary fiction", "character study",
        "theme driven", "beautifully written", "thought provoking",
        "thought-provoking",
    ],

    "historical": [
        "historical", "historical fiction", "period piece",
        "set in the past", "historically inspired",
    ],

    "post-apocalyptic": [
        "post apocalyptic", "post-apocalyptic", "after the apocalypse",
        "end of the world", "societal collapse", "collapsed society",
    ],

    "cyberpunk": [
        "cyberpunk", "megacorporation", "corporate dystopia",
        "high tech low life", "neon future", "cybernetic",
    ],

    "steampunk": [
        "steampunk", "clockwork", "victorian technology",
        "airships", "steam powered",
    ],

    "urban-fantasy": [
        "urban fantasy", "modern fantasy", "magic in the modern world",
        "hidden magical world", "supernatural city",
    ],

    "dark-academia": [
        "dark academia", "elite school", "academic rivalry",
        "obsession with knowledge", "secret society",
    ],

    "academia": [
        "academia", "university setting", "college setting",
        "scholarly", "academic environment",
    ],

    "military": [
        "military", "military sci fi", "military fantasy",
        "army", "soldiers", "war campaign",
        "battle strategy", "combat focused",
    ],

    "war": [
        "war", "wartime", "battlefield", "conflict",
        "military conflict", "war story",
    ],

    "heist": [
        "heist", "robbery", "crew assembling",
        "one last job", "criminal mastermind",
        "elaborate plan",
    ],

    "courtroom": [
        "courtroom drama", "legal thriller", "trial",
        "lawyer protagonist", "court case",
    ],

    "pirates": [
        "pirates", "pirate adventure", "swashbuckling",
        "high seas", "sea voyage",
    ],

    "dragons": [
        "dragons", "dragon riders", "dragon bonds",
        "dragon companion", "dragon magic",
    ],

    "vampires": [
        "vampires", "vampire romance", "bloodsucker",
        "undead", "immortal vampire",
    ],

    "werewolves": [
        "werewolves", "shifters", "wolf shifters",
        "lycanthrope", "pack dynamics",
    ],

    "fae": [
        "fae", "fair folk", "fairy court",
        "faerie", "seelie", "unseelie",
    ],

    "gods": [
        "gods", "deities", "divine beings",
        "godly powers", "pantheon",
    ],

    "chosen-one": [
        "chosen one", "chosen-one", "prophesied hero",
        "destined hero", "the chosen",
    ],

    "reluctant-hero": [
        "reluctant hero", "doesn't want the responsibility",
        "unwilling hero", "forced into adventure",
    ],

    "mentor": [
        "mentor figure", "wise mentor",
        "teacher student relationship",
        "guiding figure",
    ],

    "antihero": [
        "antihero", "anti-hero", "deeply flawed",
        "questionable morality",
    ],

    "villain-protagonist": [
        "villain protagonist", "villain main character",
        "follows the villain", "evil protagonist",
    ],

    "redemption-arc": [
        "redemption arc", "seeking redemption",
        "making amends", "redemptive journey",
    ],

    "enemies-to-lovers": [
        "enemies to lovers", "enemies-to-lovers",
        "hate to love", "rivals to lovers",
        "cannot stand each other at first",
    ],

    "friends-to-lovers": [
        "friends to lovers", "friends-to-lovers",
        "best friends romance", "longtime friends",
    ],

    "second-chance-romance": [
        "second chance romance", "former lovers",
        "rekindled romance", "old flame",
    ],

    "slow-burn-romance": [
        "slow burn romance", "slow-burn romance",
        "takes forever to get together",
        "years of tension", "romantic tension",
    ],

    "love-triangle": [
        "love triangle", "romantic triangle",
        "torn between two people",
    ],

    "forbidden-romance": [
        "forbidden romance", "star crossed lovers",
        "star-crossed", "shouldn't be together",
    ],

    "queer": [
        "queer", "lgbt", "lgbtq", "gay romance",
        "lesbian romance", "bisexual protagonist",
        "trans character", "sapphic", "achillean",
    ],

    "found-family-romance": [
        "romance and found family",
        "chosen family and romance",
    ],

    "character-driven": [
        "character driven", "character-driven",
        "focused on characters", "strong character work",
        "character focused", "character-focused",
    ],

    "plot-driven": [
        "plot driven", "plot-driven",
        "story focused", "event driven",
        "action focused narrative",
    ],

    "immersive-worldbuilding": [
        "immersive worldbuilding", "rich worldbuilding",
        "deep lore", "extensive lore",
        "detailed setting", "living world",
    ],

    "philosophical": [
        "philosophical", "existential",
        "asks big questions", "deep themes",
        "thought experiment",
    ],

    "social-commentary": [
        "social commentary", "social critique",
        "commentary on society", "politically relevant",
    ],

    "addictive": [
        "addictive", "obsessed", "couldn't stop reading",
        "binged", "read in one sitting",
        "consumed me", "hooked immediately",
    ],

    "emotional": [
        "emotional", "emotionally impactful",
        "emotionally charged", "wrecked me",
        "broke my heart", "gut punch",
        "gut-punch", "devastating",
    ],

    "comfort-read": [
        "comfort read", "comfort reread",
        "always come back to it",
        "safe read",
    ],

    "atmospheric": [
        "atmospheric", "moody", "vivid atmosphere",
        "strong sense of place", "immersive atmosphere",
    ],

    "beautiful-ending": [
        "beautiful ending", "perfect ending",
        "satisfying conclusion", "excellent finale",
    ],

    "twisty": [
        "twisty", "twists and turns",
        "shocking twists", "plot twists",
        "unexpected reveal",
    ],

    "booktok-popular": [
        "booktok", "book tok", "viral book",
        "everyone is talking about it",
        "internet favorite",
    ],

    "underrated": [
        "underrated", "hidden gem",
        "deserves more attention",
        "criminally underrated",
    ],

    "dnf-worthy": [
        "dnf", "did not finish",
        "couldn't finish", "gave up on it",
        "abandoned it",
    ],
})

MOOD_KEYWORDS.update({
    "cozy", "comforting", "wholesome",
    "atmospheric", "haunting",
    "terrifying", "creepy", "scary",
    "emotional", "heartbreaking",
    "devastating", "gut-wrenching",
    "romantic", "passionate",
    "hopeful", "optimistic",
    "melancholic", "wistful",
    "chaotic", "intense",
})

LENGTH_KEYWORDS.update({
    "novella",
    "short story",
    "standalone",
    "trilogy",
    "series",
    "multi-book series",
    "long series",
    "chunky",
    "lengthy",
    "compact",
    "brief",
})

GENRE_KEYWORDS.update({
    "epic fantasy",
    "urban fantasy",
    "dark fantasy",
    "grimdark",
    "cozy fantasy",
    "space opera",
    "hard sci-fi",
    "cyberpunk",
    "steampunk",
    "post-apocalyptic",
    "supernatural",
    "paranormal",
    "gothic",
    "dark academia",
    "young adult",
    "new adult",
    "middle grade",
    "literary fiction",
    "contemporary",
    "magical realism",
    "historical fantasy",
    "historical romance",
    "military sci-fi",
    "western",
    "adventure fantasy",
})