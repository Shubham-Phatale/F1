import { NavigatorScreenParams } from '@react-navigation/native';

// Home Tab Navigator Param List
export type HomeTabParamList = {
  HomeScreen: undefined;
  Calendar: undefined;
  Standings: undefined;
  RaceDetails: {
    raceId: string;
    season: string;
    round: string;
  };
};

// Root Stack Navigator Param List
export type RootStackParamList = {
  Home: NavigatorScreenParams<HomeTabParamList>;
};
