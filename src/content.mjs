export const languages = [
  { id: 'en', name: 'English', short: 'EN', standard: 'American English' },
  { id: 'no', name: 'Norwegian', short: 'NO', standard: 'Bokmål · Oslo pronunciation' },
];

const word = (id, term, pronunciation, meaning, translation, example, collocation, tip) =>
  ({ id, term, pronunciation, meaning, translation, example, collocation, tip });

export const lessons = [
  {
    id: 'flexible-work', title: 'A little more flexibility', category: 'Work & everyday life',
    description: 'Explore the balance between freedom, focus, and working together.',
    en: {
      title: 'A little more flexibility', description: 'Explain a preference without overlooking the trade-offs.',
      words: [
        word('work-en-1', 'a trade-off', 'TRADE-off · stress the first part', 'A situation in which gaining one benefit means giving up another.', 'en avveining', 'Working from home involves a trade-off between flexibility and spontaneous conversation.', 'a trade-off between A and B', 'Name both sides of the trade-off so your meaning is precise.'),
        word('work-en-2', 'autonomy', 'aw-TAH-nuh-mee · stress TAH', 'The freedom to make your own decisions about how you work or live.', 'selvstendighet; handlingsrom', 'Greater autonomy helps me plan demanding work for the hours when I concentrate best.', 'greater autonomy / autonomy over your work', 'Autonomy describes decision-making freedom, not simply working alone.'),
        word('work-en-3', 'to accommodate', 'uh-KAH-muh-dayt · stress KAH', 'To adjust something to make room for a particular need.', 'å ta hensyn til; å tilpasse', 'A flexible schedule can accommodate different family responsibilities.', 'accommodate different needs', 'Use it with a concrete need, rather than as a general synonym for help.'),
      ],
      argument: { prompt: 'Should employees be able to choose when and where they work? Explain one benefit and one limitation.', scaffold: ['State your position.', 'Explain who benefits and why.', 'Give a concrete example.', 'Acknowledge a trade-off.', 'End with a condition or recommendation.'], starter: 'Flexible working arrangements can be valuable, provided that…' },
      story: { prompt: 'Tell a story about a time a small change to your routine made a big difference.', scaffold: ['Set the scene.', 'Describe the difficulty.', 'Explain what you changed.', 'Show the result and what you learned.'], starter: 'For several weeks, I had been struggling to…' },
      speaking: { text: 'Greater autonomy can improve my concentration. There is a trade-off, however: a flexible schedule should also accommodate the needs of the team.', focus: ['Stress the important contrast: greater autonomy / needs of the team.', 'Pause briefly after “however.”', 'Keep “trade-off” together as one expression.'] },
    },
    no: {
      title: 'Litt mer fleksibilitet', description: 'Forklar et ønske uten å overse hensynet til andre.',
      words: [
        word('work-no-1', 'en avveining', 'avveining · ei is a vowel glide', 'En vurdering der du veier ulike hensyn mot hverandre.', 'a trade-off; a balancing of considerations', 'Hjemmekontor krever en avveining mellom fleksibilitet og samarbeid.', 'en avveining mellom A og B', 'En avveining er selve vurderingen; et kompromiss er en mulig løsning.'),
        word('work-no-2', 'handlingsrom', 'handlingsrom · keep the compound together', 'Frihet og mulighet til å velge hvordan noe skal gjøres.', 'room for maneuver; autonomy', 'Mer handlingsrom gjør det lettere å tilpasse arbeidsdagen.', 'større handlingsrom / gi noen handlingsrom', 'Beskriv gjerne hvilke valg personen faktisk kan ta.'),
        word('work-no-3', 'å tilrettelegge', 'tilrettelegge · listen for the long compound', 'Å gjøre forholdene egnet for en bestemt aktivitet eller et behov.', 'to facilitate; to accommodate', 'Arbeidsgiveren bør tilrettelegge for ulike behov.', 'tilrettelegge for noe / tilrettelegge arbeidet', 'Bruk “for” når du beskriver hva du vil gjøre mulig.'),
      ],
      argument: { prompt: 'Bør ansatte få velge når og hvor de jobber? Forklar én fordel og én begrensning.', scaffold: ['Presenter standpunktet ditt.', 'Forklar hvem som får nytte av ordningen.', 'Gi et konkret eksempel.', 'Ta opp et motargument.', 'Avslutt med en anbefaling.'], starter: 'Fleksible arbeidsordninger kan være nyttige, så lenge…' },
      story: { prompt: 'Fortell om en gang en liten endring i hverdagen gjorde en stor forskjell.', scaffold: ['Beskriv situasjonen.', 'Forklar hva som var vanskelig.', 'Fortell hva du endret.', 'Beskriv resultatet og hva du lærte.'], starter: 'I flere uker hadde jeg strevd med å…' },
      speaking: { text: 'Større handlingsrom kan gjøre det lettere å konsentrere seg. Samtidig må arbeidsgiveren tilrettelegge for samarbeid. Det krever en avveining mellom ulike behov.', focus: ['Use a clear, forward r, as commonly heard in Oslo speech.', 'Practise the vowel glide in “avveining.”', 'Pause between the three ideas rather than after every word.'] },
    },
  },
  {
    id: 'polite-disagreement', title: 'The art of disagreeing', category: 'Relationships & communication',
    description: 'Make a clear point while leaving room for another perspective.',
    en: {
      title: 'The art of disagreeing', description: 'Disagree thoughtfully and explain the grounds for your opinion.',
      words: [
        word('disagree-en-1', 'a reservation', 'rez-er-VAY-shun · stress VAY', 'A doubt or concern that keeps you from agreeing completely.', 'et forbehold', 'I support the proposal, but I have reservations about the cost.', 'have reservations about something', 'Here, a reservation means a concern, not a booking.'),
        word('disagree-en-2', 'to substantiate', 'sub-STAN-shee-ayt · stress STAN', 'To support a claim with evidence or specific facts.', 'å underbygge', 'We need more than one example to substantiate that claim.', 'substantiate a claim / substantiate an argument', 'An explanation gives reasons; substantiation adds supporting evidence.'),
        word('disagree-en-3', 'a perspective', 'per-SPEK-tiv · stress SPEK', 'A particular way of understanding a situation.', 'et perspektiv; et synspunkt', 'Her experience helped me see the issue from a different perspective.', 'from a different perspective', 'Use “from my perspective” when your experience shapes your view.'),
      ],
      argument: { prompt: 'Is it more important to be honest or to avoid hurting someone’s feelings? Explain where you would draw the line.', scaffold: ['State a nuanced position.', 'Describe a concrete situation.', 'Substantiate your reasoning.', 'Consider another perspective.', 'Explain the limits of your position.'], starter: 'I value honesty, although I have reservations about…' },
      story: { prompt: 'Tell a story about a disagreement that helped you understand someone better.', scaffold: ['Describe what you disagreed about.', 'Explain what each person wanted.', 'Show the turning point.', 'Reflect on what changed.'], starter: 'At first, I could not understand why…' },
      speaking: { text: 'I understand your perspective, but I have a reservation. Could you substantiate that claim with a specific example?', focus: ['Let your intonation signal curiosity in the question.', 'Stress “specific example,” the information you are asking for.', 'Practise “substantiate” slowly before reading the whole sentence.'] },
    },
    no: {
      title: 'Kunsten å være uenig', description: 'Si tydelig hva du mener, og gi rom for andres synspunkter.',
      words: [
        word('disagree-no-1', 'et forbehold', 'forbehold · listen to the whole word first', 'En betingelse eller innvending som begrenser støtten din.', 'a reservation; a qualification', 'Jeg støtter forslaget, men med visse forbehold.', 'med visse forbehold / ta forbehold om', 'Et forbehold gjør støtten mer begrenset eller betinget.'),
        word('disagree-no-2', 'å underbygge', 'underbygge · distinguish y from u', 'Å støtte en påstand med grunner, eksempler eller dokumentasjon.', 'to substantiate; to support', 'Du bør underbygge påstanden med et konkret eksempel.', 'underbygge en påstand / underbygge et argument', 'Vis hva som gjør påstanden troverdig, ikke bare at du er enig.'),
        word('disagree-no-3', 'et synspunkt', 'synspunkt · keep your lips rounded for y', 'En mening eller en bestemt måte å se en sak på.', 'a viewpoint', 'Jeg forstår synspunktet ditt, selv om jeg er uenig.', 'forstå et synspunkt / komme med et synspunkt', 'Et synspunkt er en mening; et faktum kan kontrolleres.'),
      ],
      argument: { prompt: 'Er det viktigst å være ærlig eller å unngå å såre andre? Forklar hvor du vil sette grensen.', scaffold: ['Presenter et nyansert standpunkt.', 'Beskriv en konkret situasjon.', 'Underbygg resonnementet ditt.', 'Ta opp et annet synspunkt.', 'Forklar når standpunktet ditt ikke gjelder.'], starter: 'Jeg mener at ærlighet er viktig, men med et forbehold: …' },
      story: { prompt: 'Fortell om en uenighet som hjalp deg å forstå en annen person bedre.', scaffold: ['Forklar hva dere var uenige om.', 'Beskriv hva begge ønsket.', 'Fortell om vendepunktet.', 'Reflekter over hva som endret seg.'], starter: 'Til å begynne med forsto jeg ikke hvorfor…' },
      speaking: { text: 'Jeg forstår synspunktet ditt, men jeg har et forbehold. Kan du underbygge påstanden med et konkret eksempel?', focus: ['Round your lips for y in “synspunkt” and “underbygge.”', 'Give “konkret eksempel” the main emphasis.', 'Practise a calm question with a natural pause after “ditt.”'] },
    },
  },
  {
    id: 'technology-and-attention', title: 'Who has your attention?', category: 'Technology & society',
    description: 'Look beyond convenience to the effects of always being connected.',
    en: {
      title: 'Who has your attention?', description: 'Discuss how technology shapes the choices you make.',
      words: [
        word('tech-en-1', 'an implication', 'im-plih-KAY-shun · stress KAY', 'A possible effect or consequence of an action or decision.', 'en konsekvens; en følge', 'We should consider the implications of checking messages throughout the day.', 'the implications of a decision', 'Use the plural when discussing several possible effects.'),
        word('tech-en-2', 'to undermine', 'un-der-MINE · stress MINE', 'To gradually weaken something, often without an obvious immediate effect.', 'å undergrave; å svekke', 'Constant interruptions can undermine our ability to concentrate.', 'undermine confidence / undermine trust', 'This describes weakening something, not simply disagreeing with it.'),
        word('tech-en-3', 'deliberate', 'dih-LIB-er-ut · adjective pronunciation', 'Done consciously and intentionally, rather than by habit.', 'bevisst; gjennomtenkt', 'I made a deliberate choice to leave my phone in another room.', 'a deliberate choice / a deliberate effort', 'The adjective ends differently from the verb “to deliberate.”'),
      ],
      argument: { prompt: 'Should people set daily limits on their use of social media? Consider benefits as well as drawbacks.', scaffold: ['State what kind of limit you mean.', 'Explain a likely benefit.', 'Give an example.', 'Consider a drawback.', 'Suggest a realistic approach.'], starter: 'A deliberate limit on social media could…' },
      story: { prompt: 'Tell a story about a day when being connected—or disconnected—changed your experience.', scaffold: ['Describe where you were.', 'Explain the role of technology.', 'Describe an unexpected consequence.', 'End with what you would do next time.'], starter: 'I had not expected such a small decision to…' },
      speaking: { text: 'Constant interruptions can undermine our concentration. Making a deliberate choice about when to check messages may have implications for how well we work.', focus: ['Stress “constant interruptions” and “deliberate choice.”', 'Keep the adjective “deliberate” short at the end.', 'Pause at the full stop before moving to your recommendation.'] },
    },
    no: {
      title: 'Hvem har oppmerksomheten din?', description: 'Drøft hvordan teknologi påvirker valgene dine.',
      words: [
        word('tech-no-1', 'en konsekvens', 'konsekvens · keep the final consonants clear', 'En følge eller virkning av noe som skjer.', 'a consequence', 'Stadige avbrytelser kan få konsekvenser for konsentrasjonen.', 'få konsekvenser for / en konsekvens av', 'En konsekvens kan være både positiv og negativ.'),
        word('tech-no-2', 'å undergrave', 'undergrave · practise it as one word', 'Å svekke grunnlaget for noe, ofte gradvis.', 'to undermine', 'For mange varsler kan undergrave evnen til å konsentrere seg.', 'undergrave tilliten / undergrave troverdigheten', 'Dette er sterkere og mer billedlig enn bare “å redusere.”'),
        word('tech-no-3', 'bevisst', 'bevisst · end with a clear st', 'Gjort med omtanke eller med en klar hensikt.', 'deliberate; conscious', 'Jeg tok et bevisst valg om å slå av varslene.', 'et bevisst valg / være bevisst på noe', '“Jeg er bevisst på” betyr at du legger merke til eller tar hensyn til noe.'),
      ],
      argument: { prompt: 'Bør vi sette en daglig grense for bruken av sosiale medier? Drøft både fordeler og ulemper.', scaffold: ['Forklar hva slags grense du mener.', 'Beskriv en mulig fordel.', 'Gi et eksempel.', 'Vurder en ulempe.', 'Foreslå en realistisk løsning.'], starter: 'En bevisst grense for bruken av sosiale medier kan…' },
      story: { prompt: 'Fortell om en dag da det å være tilgjengelig eller utilgjengelig påvirket opplevelsen din.', scaffold: ['Beskriv hvor du var.', 'Forklar hvilken rolle teknologien spilte.', 'Fortell om en uventet konsekvens.', 'Si hva du ville gjort neste gang.'], starter: 'Jeg hadde ikke ventet at et så lite valg skulle…' },
      speaking: { text: 'Stadige avbrytelser kan undergrave konsentrasjonen. Derfor tok jeg et bevisst valg om å slå av varslene. Det fikk positive konsekvenser for arbeidsdagen.', focus: ['Make a short pause after “derfor” only if you want extra emphasis.', 'Keep “et bevisst valg” as a connected phrase.', 'Read each sentence with one clear main idea.'] },
    },
  },
  {
    id: 'changing-your-mind', title: 'Room to change your mind', category: 'Ideas & personal growth',
    description: 'Explain how evidence and experience can reshape a belief.',
    en: {
      title: 'Room to change your mind', description: 'Describe a change in your thinking with care and confidence.',
      words: [
        word('change-en-1', 'an assumption', 'uh-SUMP-shun · stress SUMP', 'Something you accept as true without having fully checked it.', 'en antakelse', 'My argument depended on an assumption that later proved incorrect.', 'make an assumption / challenge an assumption', 'Separate what you know from what you are assuming.'),
        word('change-en-2', 'compelling', 'kum-PEL-ing · stress PEL', 'So convincing or interesting that it deserves serious attention.', 'overbevisende', 'She gave a compelling reason to reconsider the decision.', 'a compelling argument / compelling evidence', 'Explain why an argument is compelling instead of using the adjective alone.'),
        word('change-en-3', 'to reassess', 'ree-uh-SES · stress SES', 'To examine something again and possibly change your judgment.', 'å vurdere på nytt', 'The new information made me reassess my priorities.', 'reassess your priorities / reassess a decision', 'Reassessing does not necessarily mean rejecting your earlier view.'),
      ],
      argument: { prompt: 'Is changing your mind a sign of weakness or a useful skill? Explain what makes a change of opinion reasonable.', scaffold: ['State your position.', 'Distinguish evidence from pressure.', 'Give a specific example.', 'Consider when consistency matters.', 'Explain your conclusion.'], starter: 'Changing your mind can be a strength when…' },
      story: { prompt: 'Tell a story about a belief or assumption you reconsidered.', scaffold: ['Explain what you originally believed.', 'Describe what challenged it.', 'Show how you responded.', 'Explain your current view.'], starter: 'I used to assume that…' },
      speaking: { text: 'I used to make that assumption too. After hearing a compelling argument, I decided to reassess my position rather than defend it automatically.', focus: ['Contrast “used to” with “decided.”', 'Stress the second syllable in “compelling.”', 'Pause after the opening sentence, then explain the change.'] },
    },
    no: {
      title: 'Rom for å ombestemme seg', description: 'Forklar hvordan erfaringer kan endre måten du tenker på.',
      words: [
        word('change-no-1', 'en antakelse', 'antakelse · distinguish the vowels clearly', 'Noe du tror er sant uten å vite det sikkert.', 'an assumption', 'Resonnementet mitt bygde på en antakelse som viste seg å være feil.', 'bygge på en antakelse / utfordre en antakelse', 'En antakelse er ikke det samme som dokumentert kunnskap.'),
        word('change-no-2', 'overbevisende', 'overbevisende · practise in two parts, then connect them', 'Som gir gode grunner til å tro på eller støtte noe.', 'convincing; compelling', 'Hun presenterte et overbevisende argument for å endre planen.', 'et overbevisende argument / overbevisende dokumentasjon', 'Forklar hva som gjør argumentet overbevisende.'),
        word('change-no-3', 'å revurdere', 'revurdere · keep the rhythm even', 'Å vurdere noe på nytt for å se om avgjørelsen bør endres.', 'to reassess; to reconsider', 'Ny informasjon fikk meg til å revurdere standpunktet mitt.', 'revurdere et standpunkt / revurdere en beslutning', 'Du kan revurdere noe og likevel komme til samme konklusjon.'),
      ],
      argument: { prompt: 'Er det å ombestemme seg et tegn på svakhet eller en nyttig evne? Forklar når det er rimelig å endre mening.', scaffold: ['Presenter standpunktet ditt.', 'Skill mellom nye grunner og sosialt press.', 'Gi et konkret eksempel.', 'Vurder når det er viktig å være konsekvent.', 'Trekk en konklusjon.'], starter: 'Å ombestemme seg kan være en styrke når…' },
      story: { prompt: 'Fortell om en oppfatning eller antakelse du begynte å tvile på.', scaffold: ['Forklar hva du trodde før.', 'Beskriv hva som utfordret oppfatningen.', 'Fortell hvordan du reagerte.', 'Forklar hva du mener nå.'], starter: 'Tidligere tok jeg det for gitt at…' },
      speaking: { text: 'Tidligere bygde synspunktet mitt på en antakelse. Et overbevisende argument fikk meg til å revurdere saken. Nå ser jeg flere sider av den.', focus: ['Let the contrast between “tidligere” and “nå” be audible.', 'Practise the final e in “revurdere” softly.', 'Avoid rushing the longer word “overbevisende.”'] },
    },
  },
  {
    id: 'taking-a-chance', title: 'A chance worth taking', category: 'Decisions & uncertainty',
    description: 'Weigh uncertainty, possible benefits, and what you might lose.',
    en: {
      title: 'A chance worth taking', description: 'Explain a decision without pretending the outcome is certain.',
      words: [
        word('risk-en-1', 'a prerequisite', 'pree-REK-wuh-zit · stress REK', 'Something that must exist or happen before something else is possible.', 'en forutsetning', 'A financial safety net is not a prerequisite for every career change, but it can reduce the risk.', 'a prerequisite for something', 'A prerequisite is necessary; an advantage is merely helpful.'),
        word('risk-en-2', 'to outweigh', 'out-WAY · stress WAY', 'To be more important or significant than something else.', 'å veie tyngre enn; å oppveie', 'For me, the potential benefits outweigh the uncertainty.', 'the benefits outweigh the risks', 'Name the two things you are comparing.'),
        word('risk-en-3', 'feasible', 'FEE-zuh-bul · stress FEE', 'Possible to carry out successfully with the resources available.', 'gjennomførbar', 'The plan seems exciting, but we need to decide whether it is feasible.', 'a feasible plan / financially feasible', 'A plan can be desirable without being feasible.'),
      ],
      argument: { prompt: 'When is it reasonable to leave a secure situation for an uncertain opportunity?', scaffold: ['Define the kind of opportunity.', 'Explain a possible benefit.', 'Identify the main risk.', 'Describe a necessary safeguard.', 'State when you would take the chance.'], starter: 'Taking a chance is reasonable when…' },
      story: { prompt: 'Tell a story about an opportunity you accepted or turned down.', scaffold: ['Explain what was offered.', 'Describe what you had to consider.', 'Tell us what you decided.', 'Reflect on the result without assuming you knew it in advance.'], starter: 'When the opportunity first came up, I…' },
      speaking: { text: 'The benefits may outweigh the risks, but the plan still needs to be feasible. For me, having enough time to prepare is a prerequisite.', focus: ['Stress “may” to show that the outcome is uncertain.', 'Make “outweigh” and “feasible” distinct.', 'Pause before stating your personal condition.'] },
    },
    no: {
      title: 'En sjanse det er verdt å ta', description: 'Forklar en beslutning uten å late som utfallet er sikkert.',
      words: [
        word('risk-no-1', 'en forutsetning', 'forutsetning · practise the compound slowly', 'Et forhold som må være til stede for at noe skal være mulig.', 'a prerequisite; a condition', 'God planlegging er en forutsetning for at prosjektet skal lykkes.', 'en forutsetning for / under forutsetning av at', 'Ordet kan også bety en antakelse; konteksten avgjør betydningen.'),
        word('risk-no-2', 'å oppveie', 'oppveie · ei is a vowel glide', 'Å være så positivt eller betydningsfullt at det balanserer noe negativt.', 'to offset; to outweigh', 'Fordelene kan oppveie ulempene, men ikke i alle tilfeller.', 'fordelene oppveier ulempene', 'Skriv gjerne hvilke fordeler og ulemper du sammenligner.'),
        word('risk-no-3', 'gjennomførbar', 'gjennomførbar · ø is a rounded vowel', 'Som det er mulig å gjennomføre med ressursene man har.', 'feasible', 'Planen er interessant, men er den gjennomførbar?', 'en gjennomførbar plan / praktisk gjennomførbar', 'Skill mellom det du ønsker, og det du faktisk kan få til.'),
      ],
      argument: { prompt: 'Når er det rimelig å forlate en trygg situasjon for en usikker mulighet?', scaffold: ['Forklar hva slags mulighet du mener.', 'Beskriv en mulig gevinst.', 'Pek på den viktigste risikoen.', 'Forklar hva som må være på plass.', 'Si når du ville tatt sjansen.'], starter: 'Det kan være fornuftig å ta en sjanse når…' },
      story: { prompt: 'Fortell om en mulighet du takket ja eller nei til.', scaffold: ['Beskriv tilbudet.', 'Forklar hva du måtte vurdere.', 'Fortell hva du valgte.', 'Reflekter over resultatet.'], starter: 'Da muligheten dukket opp, var jeg…' },
      speaking: { text: 'Fordelene kan oppveie ulempene, men planen må være gjennomførbar. For meg er nok tid til å forberede seg en viktig forutsetning.', focus: ['Round your lips for ø in “gjennomførbar.”', 'Make the vowel glide in “oppveie” one smooth movement.', 'Emphasize “kan” rather than sounding certain about the outcome.'] },
    },
  },
  {
    id: 'a-place-to-belong', title: 'A place to belong', category: 'Community & belonging',
    description: 'Explore what helps people feel included in a shared space.',
    en: {
      title: 'A place to belong', description: 'Explain what inclusion means in everyday situations.',
      words: [
        word('community-en-1', 'a sense of belonging', 'bih-LAWNG-ing · stress LAWNG', 'The feeling that you are accepted and have a place in a group.', 'en følelse av tilhørighet', 'A regular neighborhood gathering can create a sense of belonging.', 'create / foster a sense of belonging', 'Belonging is a feeling of connection, not just membership.'),
        word('community-en-2', 'inclusive', 'in-KLOO-siv · stress KLOO', 'Designed to welcome people with different needs or backgrounds.', 'inkluderende', 'An inclusive event offers more than one way to participate.', 'an inclusive environment / an inclusive approach', 'Give a practical example of what makes the situation inclusive.'),
        word('community-en-3', 'reciprocity', 'res-ih-PRAH-suh-tee · stress PRAH', 'An exchange in which people support or respond to one another.', 'gjensidighet', 'Lasting relationships depend on some degree of reciprocity.', 'a sense of reciprocity / mutual reciprocity', 'Usually “reciprocity” alone is enough; “mutual” can be redundant.'),
      ],
      argument: { prompt: 'Should local communities invest more in shared meeting places? Explain who might benefit and what could make access difficult.', scaffold: ['State what kind of place you mean.', 'Explain a benefit.', 'Give a specific example of inclusion.', 'Consider a barrier or cost.', 'Offer a realistic recommendation.'], starter: 'Shared meeting places can strengthen a community if…' },
      story: { prompt: 'Tell a story about a time you felt welcome—or helped someone else feel welcome.', scaffold: ['Set the scene.', 'Describe an action, not only a feeling.', 'Explain how someone responded.', 'Reflect on why it mattered.'], starter: 'I did not know anyone there, so…' },
      speaking: { text: 'An inclusive community gives people a sense of belonging. Small acts of reciprocity can make a shared space feel welcoming.', focus: ['Practise “reciprocity” slowly with the stress on PRAH.', 'Let the words “belonging” and “welcoming” carry the main emphasis.', 'Use a short pause between the two ideas.'] },
    },
    no: {
      title: 'Et sted å høre til', description: 'Forklar hva inkludering betyr i konkrete hverdagssituasjoner.',
      words: [
        word('community-no-1', 'tilhørighet', 'tilhørighet · round your lips for ø', 'Følelsen av å høre til og bli akseptert i et fellesskap.', 'belonging', 'Et fast møtested kan gi en sterkere følelse av tilhørighet.', 'en følelse av tilhørighet / skape tilhørighet', 'Tilhørighet handler om opplevelsen av å høre til, ikke bare medlemskap.'),
        word('community-no-2', 'inkluderende', 'inkluderende · let the final e stay light', 'Som gir ulike mennesker en reell mulighet til å delta.', 'inclusive', 'Et inkluderende arrangement gir flere måter å delta på.', 'et inkluderende miljø / en inkluderende holdning', 'Gi et konkret eksempel på hvem som kan delta og hvordan.'),
        word('community-no-3', 'gjensidighet', 'gjensidighet · practise the opening gj sound', 'Et forhold der begge parter gir, tar imot eller viser hensyn.', 'reciprocity', 'Gode naboforhold bygger ofte på gjensidighet.', 'bygge på gjensidighet / preget av gjensidighet', 'I vanlig Oslo-uttale har gj her en j-lyd, ikke en hard g.'),
      ],
      argument: { prompt: 'Bør lokalsamfunn investere mer i felles møteplasser? Forklar hvem som kan ha nytte av dem, og hva som kan hindre deltakelse.', scaffold: ['Forklar hva slags møteplass du mener.', 'Beskriv en fordel.', 'Gi et eksempel på inkludering.', 'Vurder en hindring eller en kostnad.', 'Kom med en realistisk anbefaling.'], starter: 'Felles møteplasser kan styrke nærmiljøet dersom…' },
      story: { prompt: 'Fortell om en gang du følte deg velkommen, eller hjalp en annen med å føle seg velkommen.', scaffold: ['Beskriv situasjonen.', 'Fortell om en konkret handling.', 'Beskriv reaksjonen.', 'Forklar hvorfor det betydde noe.'], starter: 'Jeg kjente ingen der, så…' },
      speaking: { text: 'Et inkluderende nærmiljø kan gi en følelse av tilhørighet. Små handlinger og gjensidighet gjør det lettere å bli kjent.', focus: ['Practise the j-like opening in “gjensidighet.”', 'Round your lips for ø in “tilhørighet.”', 'Keep “en følelse av tilhørighet” together as one phrase.'] },
    },
  },
  {
    id: 'what-to-believe', title: 'What makes a claim credible?', category: 'Information & critical thinking',
    description: 'Distinguish a persuasive message from a well-supported claim.',
    en: {
      title: 'What makes a claim credible?', description: 'Discuss uncertainty without making your message vague.',
      words: [
        word('evidence-en-1', 'credible', 'KRED-uh-bul · stress KRED', 'Believable because there are good reasons to trust it.', 'troverdig', 'A credible explanation should be consistent with the available evidence.', 'a credible source / a credible explanation', 'A confident tone alone does not make a source credible.'),
        word('evidence-en-2', 'to corroborate', 'kuh-RAH-buh-rayt · stress RAH', 'To support a statement with additional, independent information.', 'å bekrefte; å underbygge', 'A second independent report corroborated the main findings.', 'corroborate a claim / corroborate an account', 'Use it when additional evidence supports an existing account.'),
        word('evidence-en-3', 'tentative', 'TEN-tuh-tiv · stress TEN', 'Not yet certain or final and open to revision.', 'foreløpig; forsiktig', 'We reached a tentative conclusion because some data was still missing.', 'a tentative conclusion / a tentative explanation', 'Tentative signals limited certainty; it need not mean careless.'),
      ],
      argument: { prompt: 'What should someone check before sharing a surprising claim online?', scaffold: ['State your main recommendation.', 'Explain what makes a source credible.', 'Describe how to check a claim.', 'Acknowledge what may remain uncertain.', 'End with a practical rule.'], starter: 'Before sharing a surprising claim, I would…' },
      story: { prompt: 'Tell a story about a claim you first believed but later checked more carefully.', scaffold: ['Describe the original claim.', 'Explain why it seemed believable.', 'Tell us what you checked.', 'Explain how your conclusion changed.'], starter: 'The message sounded convincing because…' },
      speaking: { text: 'The source seems credible, but my conclusion is still tentative. I would like another independent source to corroborate the claim.', focus: ['Use “seems” and “still tentative” to express your level of certainty.', 'Stress KRED in “credible” and RAH in “corroborate.”', 'Pause before explaining what evidence you still need.'] },
    },
    no: {
      title: 'Hva gjør en påstand troverdig?', description: 'Uttrykk usikkerhet uten at budskapet blir uklart.',
      words: [
        word('evidence-no-1', 'troverdig', 'troverdig · the final g is normally silent', 'Som det er gode grunner til å stole på.', 'credible; trustworthy', 'En troverdig forklaring bør stemme med opplysningene vi har.', 'en troverdig kilde / en troverdig forklaring', 'En selvsikker framstilling er ikke nødvendigvis troverdig.'),
        word('evidence-no-2', 'å etterprøve', 'etterprøve · round your lips for ø', 'Å undersøke om en påstand eller et resultat holder.', 'to verify; to test independently', 'Det bør være mulig å etterprøve opplysningene.', 'etterprøve en påstand / etterprøve et resultat', 'Å etterprøve kan føre til at en påstand blir bekreftet eller avkreftet.'),
        word('evidence-no-3', 'foreløpig', 'foreløpig · practise the rounded ø', 'Som gjelder nå, men kan endres når vi får mer kunnskap.', 'tentative; provisional', 'Dette er en foreløpig konklusjon, ikke et endelig svar.', 'en foreløpig konklusjon / foreløpige resultater', 'Ordet viser at du holder muligheten for endring åpen.'),
      ],
      argument: { prompt: 'Hva bør man undersøke før man deler en overraskende påstand på nettet?', scaffold: ['Presenter hovedrådet ditt.', 'Forklar hva som gjør en kilde troverdig.', 'Beskriv hvordan påstanden kan etterprøves.', 'Si hva som fortsatt kan være usikkert.', 'Avslutt med en praktisk regel.'], starter: 'Før jeg deler en overraskende påstand, ville jeg…' },
      story: { prompt: 'Fortell om en påstand du først trodde på, men senere undersøkte nærmere.', scaffold: ['Beskriv påstanden.', 'Forklar hvorfor den virket troverdig.', 'Fortell hva du undersøkte.', 'Forklar hvordan konklusjonen din endret seg.'], starter: 'Påstanden virket overbevisende fordi…' },
      speaking: { text: 'Kilden virker troverdig, men konklusjonen er foreløpig. Jeg vil gjerne etterprøve opplysningene før jeg deler dem videre.', focus: ['In ordinary Oslo speech, the final g in “troverdig” is silent.', 'Round your lips for ø in “foreløpig” and “etterprøve.”', 'Emphasize what you will do before sharing: “etterprøve opplysningene.”'] },
    },
  },
];
