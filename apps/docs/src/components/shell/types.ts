type NavigationLesson = {
  slug: string;
  title: string;
};

type NavigationComponent = {
  slug: string;
  title: string;
};

type NavigationGroup = {
  id: string;
  title: string;
  components: NavigationComponent[];
};

export type DocsNavigationData = {
  lessons: NavigationLesson[];
  componentGroups: NavigationGroup[];
};

export type PaletteEntry = {
  route: string;
  title: string;
  group: string;
};
