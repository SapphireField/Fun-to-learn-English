// Public-domain originals: all authors died before 1911, all source editions
// below were published before 1931. No modern translations are included.
// Excerpts were checked against the linked transcriptions. Obvious OCR errors
// in the Norwegian scans (such as “idste” for “sidste”) have been corrected.
const stevenson = {
  label: 'Project Gutenberg · A Child’s Garden of Verses',
  url: 'https://raw.githubusercontent.com/GITenberg/A-Child-s-Garden-of-Verses_136/master/136.txt',
};
const blake = {
  label: 'Project Gutenberg · Songs of Innocence and Songs of Experience',
  url: 'https://raw.githubusercontent.com/GITenberg/Songs-of-Innocence-and-Songs-of-Experience_1934/master/1934-0.txt',
};
const ibsen = {
  label: 'Nasjonalbiblioteket transcription · Digte (1891 edition)',
  url: 'https://raw.githubusercontent.com/titaenstad/public_domain_poetry/main/pre1900/2010041612005.txt',
};
const bjornson = {
  label: 'Nasjonalbiblioteket transcription · Digte og sange (1880 edition)',
  url: 'https://raw.githubusercontent.com/titaenstad/public_domain_poetry/main/pre1900/2012102208034.txt',
};
const historical = 'Historical Danish-Norwegian spelling, preserved from the cited edition; this is a literary reading, not a model for modern Bokmål spelling.';

export const poems = [
  {
    id: 'en-hope', language: 'en', title: 'Hope is the thing with feathers',
    author: 'Emily Dickinson', authorDates: '1830–1886', year: 1891, excerpt: false,
    lines: [
      'Hope is the thing with feathers', 'That perches in the soul,', 'And sings the tune without the words,', 'And never stops at all,', '',
      'And sweetest in the gale is heard;', 'And sore must be the storm', 'That could abash the little bird', 'That kept so many warm.', '',
      'I’ve heard it in the chillest land,', 'And on the strangest sea;', 'Yet, never, in extremity,', 'It asked a crumb of me.',
    ],
    source: { label: 'Project Gutenberg · Poems by Emily Dickinson, Second Series', url: 'https://raw.githubusercontent.com/GITenberg/Poems-by-Emily-Dickinson-Three-Series-Complete_12242/master/12242-8.txt' },
    context: 'The complete poem, first published in the 1891 Second Series. This early printed edition uses different punctuation from Dickinson’s manuscript.',
    readingPrompt: 'Read it once gently, then emphasize “never.” How does a bird make the idea of hope feel concrete?',
    glossary: [{ term: 'perches', meaning: 'rests on a branch or another raised place' }, { term: 'soul', meaning: 'a person’s inner emotional or spiritual life' }],
  },
  {
    id: 'en-rain', language: 'en', title: 'Rain', author: 'Robert Louis Stevenson',
    authorDates: '1850–1894', year: 1885, excerpt: false,
    lines: ['The rain is falling all around,', 'It falls on field and tree,', 'It rains on the umbrellas here,', 'And on the ships at sea.'],
    source: stevenson,
    context: 'A complete four-line poem from A Child’s Garden of Verses. The cited transcription reads “falling” in the opening line.',
    readingPrompt: 'Keep the rhythm light. Picture the view widening from an umbrella nearby to a ship far away.',
    glossary: [{ term: 'field', meaning: 'an open area of land, often used for growing crops' }, { term: 'at sea', meaning: 'on the ocean, away from land' }],
  },
  {
    id: 'en-wind', language: 'en', title: 'The Wind', author: 'Robert Louis Stevenson',
    authorDates: '1850–1894', year: 1885, excerpt: false,
    lines: [
      'I saw you toss the kites on high', 'And blow the birds about the sky;', 'And all around I heard you pass,', 'Like ladies’ skirts across the grass—', 'O wind, a-blowing all day long,', 'O wind, that sings so loud a song!', '',
      'I saw the different things you did,', 'But always you yourself you hid.', 'I felt you push, I heard you call,', 'I could not see yourself at all—', 'O wind, a-blowing all day long,', 'O wind, that sings so loud a song!', '',
      'O you that are so strong and cold,', 'O blower, are you young or old?', 'Are you a beast of field and tree,', 'Or just a stronger child than me?', 'O wind, a-blowing all day long,', 'O wind, that sings so loud a song!',
    ],
    source: stevenson,
    context: 'The complete poem from A Child’s Garden of Verses. The speaker talks directly to the wind. Typographic apostrophes and dashes have been regularized.',
    readingPrompt: 'Make the last two lines sound like a chorus. Which verbs help you hear or see something invisible?',
    glossary: [{ term: 'toss', meaning: 'throw or move something lightly through the air' }, { term: 'on high', meaning: 'high up in the air; a poetic expression' }],
  },
  {
    id: 'en-shadow', language: 'en', title: 'My Shadow', author: 'Robert Louis Stevenson',
    authorDates: '1850–1894', year: 1885, excerpt: false,
    lines: [
      'I have a little shadow that goes in and out with me,', 'And what can be the use of him is more than I can see.', 'He is very, very like me from the heels up to the head;', 'And I see him jump before me, when I jump into my bed.', '',
      'The funniest thing about him is the way he likes to grow—', 'Not at all like proper children, which is always very slow;', 'For he sometimes shoots up taller like an india-rubber ball,', 'And he sometimes goes so little that there’s none of him at all.', '',
      'He hasn’t got a notion of how children ought to play,', 'And can only make a fool of me in every sort of way.', 'He stays so close behind me, he’s a coward you can see;', 'I’d think shame to stick to nursie as that shadow sticks to me!', '',
      'One morning, very early, before the sun was up,', 'I rose and found the shining dew on every buttercup;', 'But my lazy little shadow, like an arrant sleepy-head,', 'Had stayed at home behind me and was fast asleep in bed.',
    ],
    source: stevenson,
    context: 'The complete poem from A Child’s Garden of Verses turns an ordinary shadow into a curious companion. “Nursie” is an affectionate old word for a nurse or caregiver.',
    readingPrompt: 'Try reading it with the puzzled voice of someone meeting their shadow for the first time.',
    glossary: [{ term: 'shadow', meaning: 'a dark shape made when something blocks the light' }, { term: 'heels', meaning: 'the back parts of your feet' }],
  },
  {
    id: 'en-swing', language: 'en', title: 'The Swing', author: 'Robert Louis Stevenson',
    authorDates: '1850–1894', year: 1885, excerpt: false,
    lines: [
      'How do you like to go up in a swing,', 'Up in the air so blue?', 'Oh, I do think it the pleasantest thing', 'Ever a child can do!', '',
      'Up in the air and over the wall,', 'Till I can see so wide,', 'River and trees and cattle and all', 'Over the countryside—', '',
      'Till I look down on the garden green,', 'Down on the roof so brown—', 'Up in the air I go flying again,', 'Up in the air and down!',
    ],
    source: stevenson,
    context: 'The complete poem from A Child’s Garden of Verses. Its rising and falling rhythm echoes the movement of a swing.',
    readingPrompt: 'Let your voice rise and fall with the swing. What everyday experience would you describe with the same enthusiasm?',
    glossary: [{ term: 'swing', meaning: 'a seat hanging from ropes or chains that moves backward and forward' }, { term: 'pleasantest', meaning: 'most enjoyable; a less common form of “most pleasant”' }],
  },
  {
    id: 'en-poison-tree', language: 'en', title: 'A Poison Tree', author: 'William Blake',
    authorDates: '1757–1827', year: 1794, excerpt: false,
    lines: [
      'I was angry with my friend:', 'I told my wrath, my wrath did end.', 'I was angry with my foe:', 'I told it not, my wrath did grow.', '',
      'And I watered it in fears', 'Night and morning with my tears,', 'And I sunnèd it with smiles', 'And with soft deceitful wiles.', '',
      'And it grew both day and night,', 'Till it bore an apple bright,', 'And my foe beheld it shine,', 'And he knew that it was mine,—', '',
      'And into my garden stole', 'When the night had veiled the pole;', 'In the morning, glad, I see', 'My foe outstretched beneath the tree.',
    ],
    source: blake,
    context: 'The complete poem from Songs of Experience. Its dark fable contrasts anger that is expressed with anger that is nurtured in secret.',
    readingPrompt: 'Emphasize “friend” and “foe,” then “end” and “grow.” What changes between the two pairs of lines?',
    glossary: [{ term: 'wrath', meaning: 'strong anger; a literary word' }, { term: 'foe', meaning: 'an enemy or opponent; a literary word' }],
  },
  {
    id: 'en-fly', language: 'en', title: 'The Fly', author: 'William Blake',
    authorDates: '1757–1827', year: 1794, excerpt: false,
    lines: [
      'Little Fly,', 'Thy summer’s play', 'My thoughtless hand', 'Has brushed away.', '',
      'Am not I', 'A fly like thee?', 'Or art not thou', 'A man like me?', '',
      'For I dance,', 'And drink, and sing,', 'Till some blind hand', 'Shall brush my wing.', '',
      'If thought is life', 'And strength and breath,', 'And the want', 'Of thought is death;', '',
      'Then am I', 'A happy fly.', 'If I live,', 'Or if I die.',
    ],
    source: blake,
    context: 'The complete poem from Songs of Experience. An encounter with a small insect becomes a question about shared vulnerability.',
    readingPrompt: 'Leave a small pause between the stanzas. Let the second question sound genuinely curious.',
    glossary: [{ term: 'thy / thee / thou', meaning: 'old forms of “your / you / you”' }, { term: 'thoughtless', meaning: 'done without considering the possible effect' }],
  },
  {
    id: 'no-borte', language: 'no', title: 'Borte!', author: 'Henrik Ibsen',
    authorDates: '1828–1906', year: 1871, excerpt: false,
    lines: [
      'De sidste gæster', 'vi fulgte til grinden;', 'farvellets rester', 'tog nattevinden.', '',
      'I tifold øde', 'lå haven og huset,', 'hvor toner søde', 'mig nys berused.', '',
      'Det var en fest kun,', 'før natten den sorte;', 'hun var en gæst kun, —', 'og nu er hun borte.',
    ],
    source: ibsen,
    context: `The complete poem from Digte. A quiet scene after a gathering suggests a larger feeling of absence. ${historical}`,
    readingPrompt: 'Read it softly and pause after “grinden.” Which sounds or images suggest that the gathering has ended?',
    glossary: [{ term: 'sidste / gæster', meaning: 'historical spellings of modern Bokmål “siste / gjester”: last / guests' }, { term: 'grinden', meaning: 'the gate; modern Bokmål commonly “grinda” or “grinden”' }, { term: 'farvellets rester', meaning: 'the remains or echoes of the goodbye' }],
  },
  {
    id: 'no-april', language: 'no', title: 'Valg — Jeg vælger mig april', author: 'Bjørnstjerne Bjørnson',
    authorDates: '1832–1910', year: 1880, excerpt: false,
    lines: [
      'Jeg vælger mig april!', 'i den det gamle faller,', 'i den det ny får fæste;', 'det volder lidt rabalder, —', 'dog fred er ej det bedste,', 'men at man noget vil.', '',
      'Jeg vælger mig april,', 'fordi den stormer, fejer,', 'fordi den smiler, smelter,', 'fordi den ævner ejer,', 'fordi den kræfter vælter, —', 'i den blir somren til!',
    ],
    source: bjornson,
    context: `The complete “Valg,” following the 1880 collected edition. April’s unsettled weather becomes an image of energetic change. ${historical}`,
    readingPrompt: 'Give “april” some energy. Does the speaker prefer comfort, change, or a mixture of both?',
    glossary: [{ term: 'vælger', meaning: 'chooses; modern Bokmål “velger”' }, { term: 'får fæste', meaning: 'takes hold or becomes established; modern Bokmål “får feste”' }, { term: 'rabalder', meaning: 'a commotion, noise, or disturbance' }],
  },
  {
    id: 'no-jeg-ser', language: 'no', title: 'Jeg ser', author: 'Sigbjørn Obstfelder',
    authorDates: '1866–1900', year: 1893, excerpt: false,
    lines: [
      'Jeg ser paa den hvide himmel,', 'jeg ser paa de graablaa skyer,', 'jeg ser paa den blodige sol.', '',
      'Dette er altsaa verden.', 'Dette er altsaa klodernes hjem.', '',
      'En regndraabe!', '',
      'Jeg ser paa de høie huse,', 'jeg ser paa de tusende vinduer,', 'jeg ser paa det fjerne kirketaarn.', '',
      'Dette er altsaa jorden.', 'Dette er altsaa menneskenes hjem.', '',
      'De graablaa skyer samler sig. Solen blev borte.', '',
      'Jeg ser paa de velklædte herrer,', 'jeg ser paa de smilende damer,', 'jeg ser paa de ludende heste.', '',
      'Hvor de graablaa skyer blir tunge.', '',
      'Jeg ser, jeg ser . . .', 'Jeg er vist kommet paa en feil klode!', 'Her er saa underligt. . . .',
    ],
    source: { label: 'Nasjonalbiblioteket transcription · Digte og novelletter (1913 edition)', url: 'https://raw.githubusercontent.com/titaenstad/public_domain_poetry/main/post1900/2009111012004.txt' },
    context: `The complete poem, first published in Digte in 1893, following the 1913 collected edition. Observing the world becomes a feeling of being out of place. ${historical}`,
    readingPrompt: 'Repeat “jeg ser” at an even pace. How does the mood change when you reach “den blodige sol”?',
    glossary: [{ term: 'paa / graablaa', meaning: 'historical spellings of modern Bokmål “på / gråblå”: at or on / gray-blue' }, { term: 'hvide', meaning: 'white; modern Bokmål “hvite”' }, { term: 'blodige', meaning: 'bloody or blood-colored; an intense poetic image here' }],
  },
  {
    id: 'no-foraaret', language: 'no', title: 'Til Foraaret', author: 'Henrik Wergeland',
    authorDates: '1808–1845', year: 1845, excerpt: true,
    lines: ['O Foraar! Foraar! red mig!', 'Ingen har elsket dig ømmere end jeg.', 'Dit første Græs er mig meer værd end en Smaragd.', 'Jeg kalder dine Anemoner Aarets Pryd,', 'skjøndt jeg nok veed, at Roserne ville komme.'],
    source: { label: 'Nasjonalbiblioteket transcription · Mindre Digte (1882 edition)', url: 'https://raw.githubusercontent.com/titaenstad/public_domain_poetry/main/pre1900/2008033104026.txt' },
    context: `The opening of a poem written during Wergeland’s final illness in 1845. The speaker addresses spring as someone who might bring help. ${historical}`,
    readingPrompt: 'Read the opening as a direct appeal. Why might a little spring grass be worth more than a precious stone?',
    glossary: [{ term: 'Foraar', meaning: 'spring; modern Bokmål “vår”' }, { term: 'red mig', meaning: 'save me; modern Bokmål “redd meg”' }, { term: 'ømmere', meaning: 'more tenderly or affectionately' }, { term: 'en Smaragd', meaning: 'an emerald, a precious green stone' }],
  },
  {
    id: 'no-svane', language: 'no', title: 'En svane', author: 'Henrik Ibsen',
    authorDates: '1828–1906', year: 1871, excerpt: false,
    lines: [
      'Min hvide svane,', 'du stumme, du stille;', 'hverken slag eller trille', 'lod sangrøst ane.', '',
      'Angst beskyttende', 'alfen, som sover, —', 'altid lyttende,', 'gled du henover.', '',
      'Men sidste mødet,', 'da eder og øjne', 'var lønlige løgne, —', 'ja da, da lød det!', '',
      'I toners føden', 'du slutted din bane.', 'Du sang i døden; —', 'du var dog en svane!',
    ],
    source: ibsen,
    context: `The complete poem from Digte, later also set to music. The quiet swan is an image whose meaning unfolds through the four stanzas. ${historical}`,
    readingPrompt: 'Keep the first two lines gentle. How does the repeated “du” make the address feel personal?',
    glossary: [{ term: 'hvide', meaning: 'white; modern Bokmål “hvite”' }, { term: 'stumme', meaning: 'silent, or unable to speak' }, { term: 'trille', meaning: 'a trill, a quickly repeated musical note' }, { term: 'sangrøst', meaning: 'singing voice; a literary compound' }],
  },
  {
    id: 'no-bergmanden', language: 'no', title: 'Bergmanden', author: 'Henrik Ibsen',
    authorDates: '1828–1906', year: 1871, excerpt: true,
    lines: [
      'Bergvæg, brist med drøn og brag', 'for mit tunge hammerslag!', 'Nedad må jeg vejen bryde,', 'til jeg hører malmen lyde.', '',
      'Dybt i fjeldets øde nat', 'vinker mig den rige skat, —', 'diamant og ædelstene', 'mellem guldets røde grene.',
    ],
    source: ibsen,
    context: `The opening two stanzas from the longer poem in Digte turn mining into an image of searching beneath the surface. ${historical}`,
    readingPrompt: 'Try a strong, steady beat on “drøn og brag.” What might the miner be searching for beyond literal ore?',
    glossary: [{ term: 'Bergvæg', meaning: 'a rock face or rock wall; modern Bokmål “bergvegg”' }, { term: 'drøn og brag', meaning: 'loud rumbling and crashing sounds' }, { term: 'malmen', meaning: 'the ore: rock containing useful metal' }],
  },
  {
    id: 'no-faederlandssang', language: 'no', title: 'Fædrelands-sang', author: 'Bjørnstjerne Bjørnson',
    authorDates: '1832–1910', year: 1880, excerpt: true,
    lines: [
      'Jeg vil værge mit land,', 'jeg vil bygge mit land,', 'jeg vil ælske det fræm i min bøn, i mit barn,', 'jeg vil øge dets gavn,', 'jeg vil søge dets savn', 'ifra grænsen og ud til de drivende garn.', '',
      'Her er sommer-sol nok,', 'her er sædejord nok,', 'bare vi, bare vi have kærlighed nok.', 'Her er digtende trang', 'gænnem arbejdets gang', 'til at løfte vort land, blot vi løfter i flok.',
    ],
    source: bjornson,
    context: `The opening two stanzas, associated with Fiskerjenten, following the 1880 collected edition. Unfamiliar forms such as “ælske” and “fræm” are preserved, not modernized. ${historical}`,
    readingPrompt: 'Let each “jeg vil” build momentum. Which actions does the speaker connect with caring for a country?',
    glossary: [{ term: 'værge', meaning: 'protect or defend; modern Bokmål “verge”' }, { term: 'ælske det fræm', meaning: 'love it into growth; an older spelling and poetic expression' }, { term: 'gavn / savn', meaning: 'benefit / what is lacking or missed' }, { term: 'garn', meaning: 'fishing nets in this context' }],
  },
];

/** One poem per Oslo calendar day and language, cycling through its own shelf. */
export function getDailyPoem(dateKey, language) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError('Expected a calendar date in YYYY-MM-DD format.');
  }
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) {
    throw new RangeError('Invalid calendar date.');
  }
  if (!['en', 'no'].includes(language)) throw new RangeError('Choose English or Norwegian.');
  const shelf = poems.filter(poem => poem.language === language);
  const days = (date.getTime() - Date.UTC(2026, 9, 31)) / 86_400_000;
  return shelf[((days % shelf.length) + shelf.length) % shelf.length];
}
