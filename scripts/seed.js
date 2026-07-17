import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const SEED_POSTS = [
  {title:'פארק הירקון', desc:'מקום מושלם לפיקניק, רכיבה על אופניים או פשוט לשבת ליד המים. יש גם פינת חי!', cat:'nature', price:'⭐⭐⭐⭐⭐', loc:'תל אביב', emoji:'🌳', color:'#eafaf0', likes:210},
  {title:'שוק הכרמל', desc:'שוק תוסס עם אוכל טרי, בגדים ואווירה ישראלית אמיתית. חובה לבוא רעבים!', cat:'shopping', price:'⭐⭐⭐⭐', loc:'תל אביב', emoji:'🛍️', color:'#fff4e0', likes:156},
  {title:'חוף הבונים', desc:'חוף פראי ושקט עם מים צלולים, מעולה לשנורקלינג ולשקיעה מהממת.', cat:'beach', price:'⭐⭐⭐⭐⭐', loc:'חוף הכרמל', emoji:'🏖️', color:'#e6f0ff', likes:340},
  {title:'מוזיאון תל אביב לאמנות', desc:'תערוכות מרתקות של אמנות ישראלית ובינלאומית. הקפה בפנים מומלץ.', cat:'culture', price:'⭐⭐⭐⭐', loc:'תל אביב', emoji:'🖼️', color:'#f0e9ff', likes:88},
  {title:'בית קפה "נוגה"', desc:'קפה מעולה, עוגות בית ופינה שקטה לעבודה או פגישה. הצוות אדיב במיוחד.', cat:'cafe', price:'⭐⭐⭐⭐', loc:'רמת גן', emoji:'☕', color:'#fff9db', likes:64},
  {title:'מסעדת "הים התיכון"', desc:'דגים טריים ומטבח ים תיכוני אותנטי עם נוף לחוף. מומלץ להזמין מראש.', cat:'restaurant', price:'⭐⭐⭐⭐⭐', loc:'יפו', emoji:'🍽️', color:'#ffe9ef', likes:198},
  {title:'לונה פארק סופרלנד', desc:'כיף לכל המשפחה — מתקנים לילדים ולמבוגרים, ואוכל שטוף שמן ומעולה.', cat:'attraction', price:'⭐⭐⭐⭐', loc:'ראשון לציון', emoji:'🎡', color:'#e9fbf7', likes:245},
  {title:'טיול למצפה רמון', desc:'נוף עוצר נשימה על המכתש, שביל הליכה מדהים לשקיעה. קחו הרבה מים!', cat:'hiking', price:'⭐⭐⭐⭐⭐', loc:'מצפה רמון', emoji:'🥾', color:'#f3f0e8', likes:302},
  {title:'רחוב רוטשילד בלילה', desc:'ברים, מוזיקה חיה ואווירה תוססת עד השעות הקטנות. המקום הכי חי בעיר.', cat:'nightlife', price:'⭐⭐⭐⭐', loc:'תל אביב', emoji:'🌃', color:'#fff4e0', likes:176},
  {title:'גני שרונה', desc:'שוק אוכל מודרני עם מסעדות מכל העולם, מקום מעולה למפגש חברים.', cat:'restaurant', price:'⭐⭐⭐⭐', loc:'תל אביב', emoji:'🍜', color:'#eafaf0', likes:132},
  {title:'שמורת עין גדי', desc:'מפלים, בעלי חיים בר ונוף מדברי מהמם. הליכה קלילה ומתאימה למשפחות.', cat:'nature', price:'⭐⭐⭐⭐⭐', loc:'ים המלח', emoji:'⛰️', color:'#e6f0ff', likes:289},
  {title:'טיילת חיפה', desc:'נוף לים ולכרמל, מעולה לריצה, אופניים או סתם הליכה רגועה בשקיעה.', cat:'nature', price:'⭐⭐⭐⭐', loc:'חיפה', emoji:'🌅', color:'#ffe9ef', likes:97},
];

async function seed() {
  for (const p of SEED_POSTS) {
    await sql`
      insert into posts (title, description, category, price, location, emoji, color, likes)
      values (${p.title}, ${p.desc}, ${p.cat}, ${p.price}, ${p.loc}, ${p.emoji}, ${p.color}, ${p.likes})
    `;
  }
  console.log(`Seeded ${SEED_POSTS.length} posts.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
