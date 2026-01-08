import {
  CreditCard,
  HeartPulse,
  Home,
  Lightbulb,
  Package,
  Smartphone,
  Users,
  Car,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const recurringGroups: {
  value: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  items: string[];
  itemsEn: string[];
}[] = [
  {
    value: "Жилище",
    label: "Жилище",
    labelEn: "Housing",
    icon: Home,
    items: [
      "Наем/Ипотека",
      "Домоуправител",
      "Данък смет/сгради",
      "Застраховка на дома",
      "Охрана/СОТ",
      "Поддръжка (градинар/чистачка)",
    ],
    itemsEn: [
      "Rent/Mortgage",
      "Building manager",
      "Property/garbage tax",
      "Home insurance",
      "Security/Alarm",
      "Maintenance (gardener/cleaner)",
    ],
  },
  {
    value: "Комунални услуги",
    label: "Комунални услуги",
    labelEn: "Utilities",
    icon: Lightbulb,
    items: ["Ток", "Вода", "Парно/Газ", "Топла вода", "Канализация"],
    itemsEn: ["Electricity", "Water", "Heating/Gas", "Hot water", "Sewer"],
  },
  {
    value: "Телекомуникации и Стрийминг",
    label: "Телекомуникации и Стрийминг",
    labelEn: "Telecom & Streaming",
    icon: Smartphone,
    items: [
      "Мобилен план (личен)",
      "Мобилен план (служебен)",
      "Интернет и ТВ",
      "Netflix/HBO/Disney+",
      "Spotify/Apple Music",
      "Облачно пространство (iCloud/Google Drive)",
      "YouTube Premium",
    ],
    itemsEn: [
      "Mobile plan (personal)",
      "Mobile plan (work)",
      "Internet & TV",
      "Netflix/HBO/Disney+",
      "Spotify/Apple Music",
      "Cloud storage (iCloud/Google Drive)",
      "YouTube Premium",
    ],
  },
  {
    value: "Транспорт",
    label: "Транспорт",
    labelEn: "Transport",
    icon: Car,
    items: [
      "Застраховка (ГО/Каско)",
      "Годишна винетка",
      "Данък МПС",
      "Градски транспорт",
      "Паркинг (служебен/месечен)",
      "Наем на гараж",
    ],
    itemsEn: [
      "Insurance (TPL/Casco)",
      "Annual vignette",
      "Vehicle tax",
      "Public transport",
      "Parking (work/monthly)",
      "Garage rent",
    ],
  },
  {
    value: "Финанси и Кредити",
    label: "Финанси и Кредити",
    labelEn: "Finance & Credit",
    icon: CreditCard,
    items: [
      "Потребителски кредит",
      "Лизинг (автомобил)",
      "Лизинг (техника)",
      "Застраховка „Живот“",
      "Осигуровки",
      "Такси по банкови сметки",
    ],
    itemsEn: [
      "Consumer loan",
      "Leasing (car)",
      "Leasing (equipment)",
      "Life insurance",
      "Insurance contributions",
      "Bank account fees",
    ],
  },
  {
    value: "Лична грижа и здраве",
    label: "Лична грижа и здраве",
    labelEn: "Personal care & Health",
    icon: HeartPulse,
    items: [
      "Такса фитнес/Спорт",
      "Допълнително здравно осигуряване",
      "Лекарства (месечен абонамент)",
      "Терапия/Коучинг",
    ],
    itemsEn: [
      "Gym/Sports fee",
      "Additional health insurance",
      "Medication (monthly)",
      "Therapy/Coaching",
    ],
  },
  {
    value: "Семейство и Образование",
    label: "Семейство и Образование",
    labelEn: "Family & Education",
    icon: Users,
    items: [
      "Детска градина/Ясла",
      "Училищни такси",
      "Школи/Курсове",
      "Издръжка",
      "Джобни (за деца)",
    ],
    itemsEn: [
      "Kindergarten/Nursery",
      "School fees",
      "Courses/Classes",
      "Child support",
      "Pocket money (kids)",
    ],
  },
  {
    value: "Други",
    label: "Други",
    labelEn: "Other",
    icon: Package,
    items: [
      "Членски внос",
      "Благотворителност",
      "Професионални лицензи/софтуер",
    ],
    itemsEn: [
      "Membership fees",
      "Charity",
      "Professional licenses/software",
    ],
  },
] as const;

export const recurringCategoryDefault = "Фиксирани разходи";

export const getRecurringGroupLabel = (
  group: (typeof recurringGroups)[number],
  locale: "bg" | "en",
) => (locale === "en" ? group.labelEn : group.label);

export const getRecurringItemLabel = (
  group: (typeof recurringGroups)[number],
  item: string,
  locale: "bg" | "en",
) => {
  const idx = group.items.indexOf(item);
  if (idx === -1) return item;
  if (locale === "en") return group.itemsEn[idx] ?? item;
  return item;
};
