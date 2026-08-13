import { randomUUID } from "node:crypto";
import { NAV_CATEGORIES } from "../src/lib/categories";
import { getDatabase, nowTimestamp } from "../src/lib/turso";

const PLACEHOLDER = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/500`;

async function createAuthor(data: {
  name: string;
  slug: string;
  bio: string;
}) {
  const id = randomUUID();
  await getDatabase().execute({
    sql: `
      INSERT INTO "Author" ("id", "name", "slug", "bio", "avatar", "createdAt")
      VALUES (?, ?, ?, ?, NULL, ?)
    `,
    args: [id, data.name, data.slug, data.bio, nowTimestamp()],
  });
  return { id };
}

async function createCategory(data: {
  name: string;
  slug: string;
  parentId?: string;
  order: number;
}) {
  const id = randomUUID();
  await getDatabase().execute({
    sql: `
      INSERT INTO "Category" ("id", "name", "slug", "parentId", "order", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.name,
      data.slug,
      data.parentId ?? null,
      data.order,
      nowTimestamp(),
    ],
  });
  return { id };
}

async function createPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  featured: boolean;
  categoryId: string;
  authorId: string;
  published: boolean;
  publishedAt: Date;
}) {
  const now = nowTimestamp();
  await getDatabase().execute({
    sql: `
      INSERT INTO "Post" (
        "id", "title", "slug", "excerpt", "content", "coverImage",
        "published", "featured", "views", "categoryId",
        "secondaryCategoryId", "authorId", "publishedAt", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, ?, ?, ?, ?)
    `,
    args: [
      randomUUID(),
      data.title,
      data.slug,
      data.excerpt,
      data.content,
      data.coverImage,
      data.published,
      data.featured,
      data.categoryId,
      data.authorId,
      data.publishedAt.getTime(),
      now,
      now,
    ],
  });
}

async function main() {
  await getDatabase().batch(
    [
      'DELETE FROM "Post"',
      'DELETE FROM "Category"',
      'DELETE FROM "Author"',
    ],
    "write",
  );

  const author = await createAuthor({
    name: "Abhisek Dhungel",
    slug: "abhisek-dhungel",
    bio: "Editor at TechSastra covering gadgets, autos, and tech in Nepal.",
  });

  const author2 = await createAuthor({
    name: "Robhas Sharma",
    slug: "robhas-sharma",
    bio: "Automotive and EV correspondent.",
  });

  const categoryMap = new Map<string, string>();

  for (let i = 0; i < NAV_CATEGORIES.length; i++) {
    const cat = NAV_CATEGORIES[i];
    const parent = await createCategory({
      name: cat.name,
      slug: cat.slug,
      order: i,
    });
    categoryMap.set(cat.slug, parent.id);

    if ("children" in cat && cat.children) {
      for (let j = 0; j < cat.children.length; j++) {
        const child = cat.children[j];
        const created = await createCategory({
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          order: j,
        });
        categoryMap.set(child.slug, created.id);
      }
    }
  }

  const posts: Array<{
    title: string;
    slug: string;
    category: string;
    featured?: boolean;
    coverImage: string;
    excerpt: string;
    content: string;
    authorId: string;
    publishedAt?: Date;
  }> = [
    {
      title:
        "MacBook Air M5 Launched in Nepal: Base Storage is Now 512GB — Is It the Best Value MacBook Ever?",
      slug: "macbook-air-m5-launched-in-nepal",
      category: "laptops",
      featured: true,
      publishedAt: new Date("2026-07-25T10:00:00Z"),
      coverImage: PLACEHOLDER("macbook-air-m5"),
      excerpt:
        "Apple’s MacBook Air M5 arrives in Nepal with 512GB base storage — here’s what you get and whether it’s worth buying.",
      content: `Apple has officially brought the MacBook Air M5 to Nepal, and the biggest change is hard to ignore: base storage jumps to 512GB.

That alone shifts the value conversation. For years, buyers in Nepal had to live with 256GB entry configurations that filled up quickly. With the M5 Air, everyday users — students, creators, and professionals — get breathing room out of the box.

## Specs at a glance
- Apple M5 chip
- 512GB SSD base storage
- Liquid Retina display
- MagSafe charging and modern ports

## Should you buy it?
If you want a thin, quiet laptop that lasts all day and handles everyday creative work, the M5 Air is one of the strongest options available in Nepal right now. Gamers and heavy video editors may still want to look at higher-tier MacBook Pro models.

Pricing and availability will vary by retailer, so compare authorized sellers before you buy.`,
      authorId: author.id,
    },
    {
      title: "DJI Launches Lito 1 and Lito X1 in Nepal — Starting NPR 74,499",
      slug: "dji-lito-1-lito-x1-nepal",
      category: "cameras",
      featured: true,
      publishedAt: new Date("2026-07-24T10:00:00Z"),
      coverImage: PLACEHOLDER("dji-lito"),
      excerpt:
        "DJI’s new Lito 1 and Lito X1 are now available in Nepal starting at NPR 74,499.",
      content: `DJI has expanded its Nepal lineup with the Lito 1 and Lito X1, aimed at creators who want compact capture tools without a steep learning curve.

Starting at NPR 74,499, the Lito series targets vloggers, travelers, and first-time drone/camera buyers who want polished footage with less setup friction.

Expect DJI’s usual strengths: stabilization, easy app workflows, and accessories that scale as you grow. Check authorized Nepal partners for package deals and warranty coverage.`,
      authorId: author.id,
    },
    {
      title:
        "Ather Rizta Slashing Price in Nepal — Can It Actually Solve the Energy Crisis?",
      slug: "ather-rizta-price-cut-nepal",
      category: "scooters",
      featured: true,
      publishedAt: new Date("2026-07-23T10:00:00Z"),
      coverImage: PLACEHOLDER("ather-rizta"),
      excerpt:
        "Ather Rizta gets a major price cut in Nepal. We look at what that means for EV adoption.",
      content: `Ather has cut prices on the Rizta in Nepal, making one of the more practical family EVs suddenly more accessible.

Price is only half the story. Charging access, range anxiety, and after-sales support still decide whether electric scooters become everyday transport or remain niche.

The Rizta’s family-friendly design and connected features make it interesting — but Nepal’s energy and charging infrastructure will determine how far this price cut really goes.`,
      authorId: author.id,
    },
    {
      title:
        "Oppo A6x 4G Launched in Nepal at Rs. 32,499 — What Do You Actually Get?",
      slug: "oppo-a6x-4g-nepal-launch",
      category: "mobile-phones",
      featured: true,
      publishedAt: new Date("2026-07-22T10:00:00Z"),
      coverImage: PLACEHOLDER("oppo-a6x"),
      excerpt:
        "Oppo’s A6x 4G lands in Nepal at Rs. 32,499. We break down the specs and value.",
      content: `Oppo has launched the A6x 4G in Nepal at Rs. 32,499, aiming squarely at budget buyers who still want a clean UI and decent battery life.

At this price, expect compromises on cameras and performance — but also a polished ColorOS experience and day-to-day reliability that many entry phones miss.

If your priorities are messaging, social media, and battery, the A6x is worth a look. Power users should compare mid-range options before committing.`,
      authorId: author.id,
    },
    {
      title:
        "Royal Enfield Goan Classic 350 in Nepal — Will Nepal Love the Bobber Style?",
      slug: "royal-enfield-goan-classic-350-nepal",
      category: "bikes",
      coverImage: PLACEHOLDER("re-goan"),
      excerpt:
        "Royal Enfield’s Goan Classic 350 brings bobber styling to Nepal roads.",
      content: `Royal Enfield’s Goan Classic 350 brings a bobber-inspired look to Nepal’s classic bike scene.

Style is the headline, but ride quality, spare-parts availability, and service network will decide long-term ownership happiness — especially outside Kathmandu.

If you want character over outright speed, this one is hard to ignore.`,
      authorId: author.id,
    },
    {
      title: "DJI Avata 360 Launched in Nepal — Worth the Buy?",
      slug: "dji-avata-360-nepal",
      category: "cameras",
      coverImage: PLACEHOLDER("dji-avata"),
      excerpt: "DJI Avata 360 arrives in Nepal. Is it worth your money?",
      content: `The DJI Avata 360 brings immersive FPV-style flying with a more approachable package for Nepal creators.

It’s fun, cinematic, and beginner-friendlier than traditional FPV builds — but still needs practice, open space, and responsible flying.

Worth it if you shoot action content. Skip it if you only need occasional aerial photos.`,
      authorId: author.id,
    },
    {
      title: "John Ternus to Become Apple’s New CEO — Who Exactly Is He?",
      slug: "john-ternus-apple-ceo",
      category: "blogs",
      coverImage: PLACEHOLDER("john-ternus"),
      excerpt:
        "A closer look at John Ternus and what his potential Apple CEO role could mean.",
      content: `Apple leadership chatter has put John Ternus in the spotlight. Here’s who he is and why hardware-focused leadership matters for the next decade of Apple products.

Ternus has been deeply involved in Apple’s silicon and product engineering era — the same era that produced M-series Macs and increasingly custom iPhone silicon.

For Nepal buyers, leadership changes rarely shift day-one pricing — but they do shape the long-term product roadmap.`,
      authorId: author.id,
    },
    {
      title: "MacBook Neo Review: Best Value Computer of All Time?",
      slug: "macbook-neo-review",
      category: "reviews",
      coverImage: PLACEHOLDER("macbook-neo"),
      excerpt: "Our MacBook Neo review asks the big question: best value computer ever?",
      content: `MacBook Neo promises big performance at a friendlier price. In this review we dig into build, display, battery, and real-world Nepal pricing context.

## Verdict
Strong value for students and professionals who live in browsers, documents, and light creative apps. Not a gaming machine — and that’s fine.`,
      authorId: author.id,
    },
    {
      title: "DJI Osmo Pocket 4 Price in Nepal, Specs & Availability (2026)",
      slug: "dji-osmo-pocket-4-price-nepal",
      category: "gadgets",
      coverImage: PLACEHOLDER("osmo-pocket-4"),
      excerpt:
        "DJI Osmo Pocket 4 price in Nepal, key specs, and where to buy in 2026.",
      content: `Looking for DJI Osmo Pocket 4 price in Nepal? Here’s the latest on specs, availability, and who should buy it.

Pocket cameras remain one of the easiest upgrades for creators who want gimbal-smooth footage without a full camera bag.`,
      authorId: author.id,
    },
    {
      title:
        "Nothing Phone (4a) Pro Launched in Nepal at Rs. 86,999 — Is It Actually Worth It?",
      slug: "nothing-phone-4a-pro-nepal",
      category: "gadgets",
      featured: true,
      publishedAt: new Date("2026-07-21T10:00:00Z"),
      coverImage: PLACEHOLDER("nothing-4a"),
      excerpt:
        "Nothing Phone (4a) Pro launches in Nepal at Rs. 86,999. Value check inside.",
      content: `Nothing Phone (4a) Pro is now in Nepal at Rs. 86,999, bringing the brand’s signature Glyph interface and clean software to a higher tier.

It’s stylish and distinctive — but you should compare camera samples and update commitments against similarly priced rivals before paying the premium for design.`,
      authorId: author.id,
    },
    {
      title: "Pulsar N125 Launched in Nepal – 125 CC King",
      slug: "pulsar-n125-nepal",
      category: "bikes",
      coverImage: PLACEHOLDER("pulsar-n125"),
      excerpt: "Bajaj Pulsar N125 launches in Nepal aiming for the 125cc crown.",
      content: `The Pulsar N125 enters Nepal with sporty styling and the promise of being a daily 125cc king.

For city riders, the mix of looks, mileage, and brand service network could make it a strong contender.`,
      authorId: author.id,
    },
    {
      title: "Tata Punch.ev Launching in NADA Auto Show",
      slug: "tata-punch-ev-nada",
      category: "cars",
      coverImage: PLACEHOLDER("tata-punch-ev"),
      excerpt: "Tata Punch.ev is set to appear at the NADA Auto Show.",
      content: `Tata’s Punch.ev is heading to the NADA Auto Show, giving Nepal buyers a closer look at one of India’s popular compact electric SUVs.

Expect attention on range claims, charging options, and on-road pricing once local distribution details firm up.`,
      authorId: author.id,
    },
    {
      title: "BMW iX3 Electric SUV Launched In Nepal",
      slug: "bmw-ix3-nepal",
      category: "cars",
      coverImage: PLACEHOLDER("bmw-ix3"),
      excerpt: "BMW iX3 electric SUV is now launched in Nepal.",
      content: `BMW has launched the iX3 electric SUV in Nepal, expanding premium EV choices for buyers who want range, comfort, and brand prestige.

As with any EV import, service readiness and charging planning matter as much as the brochure specs.`,
      authorId: author.id,
    },
    {
      title: "Yamaha Aerox 155 Specification and Price in Nepal",
      slug: "yamaha-aerox-155-nepal",
      category: "scooters",
      coverImage: PLACEHOLDER("aerox-155"),
      excerpt: "Yamaha Aerox 155 specs and price details for Nepal buyers.",
      content: `Yamaha’s Aerox 155 remains a sporty maxi-scooter favorite. Here’s a clean look at specifications and Nepal pricing context for shoppers comparing 155cc options.`,
      authorId: author.id,
    },
    {
      title: "The Hyundai Ioniq 6 Will have 610+ KMs Driving Range",
      slug: "hyundai-ioniq-6-range",
      category: "auto",
      coverImage: PLACEHOLDER("ioniq-6"),
      excerpt: "Hyundai Ioniq 6 claims over 610 km of driving range.",
      content: `Hyundai’s Ioniq 6 headlines with a claimed 610+ km driving range — a number that could matter a lot for Nepal’s long-route drivers if local availability and charging catch up.

Range figures always depend on speed, weather, and driving style, so treat brochure numbers as a ceiling, not a guarantee.`,
      authorId: author2.id,
    },
    {
      title: "Top Mobile Deals This Week in Kathmandu",
      slug: "top-mobile-deals-kathmandu",
      category: "deals",
      coverImage: PLACEHOLDER("mobile-deals"),
      excerpt: "This week’s best smartphone deals across Kathmandu retailers.",
      content: `From budget Androids to mid-range flagship killers, here are the standout mobile deals we’re seeing in Kathmandu this week. Always verify IMEI, warranty, and seller authenticity.`,
      authorId: author.id,
    },
    {
      title: "Startup Spotlight: Nepal Fintech Events to Watch",
      slug: "nepal-fintech-events",
      category: "events-startups",
      coverImage: PLACEHOLDER("fintech-events"),
      excerpt: "Upcoming startup and fintech events worth watching in Nepal.",
      content: `Nepal’s startup calendar is heating up. We’ve rounded up fintech and tech events that founders, investors, and builders should keep on their radar.`,
      authorId: author.id,
    },
    {
      title: "iPhone 16 Price in Nepal — Full Variant List",
      slug: "iphone-16-price-nepal",
      category: "mobile-phone-prices",
      coverImage: PLACEHOLDER("iphone-16-price"),
      excerpt: "Current iPhone 16 price list in Nepal by storage variant.",
      content: `Looking up iPhone 16 price in Nepal? Here’s a practical variant-wise guide. Prices fluctuate by importer and offer period, so treat this as a market snapshot.`,
      authorId: author.id,
    },
  ];

  for (const post of posts) {
    const categoryId = categoryMap.get(post.category);
    if (!categoryId) {
      throw new Error(`Missing category: ${post.category}`);
    }
    await createPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      featured: post.featured ?? false,
      categoryId,
      authorId: post.authorId,
      published: true,
      publishedAt:
        post.publishedAt ??
        new Date(Date.UTC(2026, 6, 20 - posts.indexOf(post), 10)),
    });
  }

  console.log(
    `Seeded ${NAV_CATEGORIES.length} parent categories and ${posts.length} posts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
