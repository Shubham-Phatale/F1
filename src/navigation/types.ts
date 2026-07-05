import { NavigatorScreenParams } from '@react-navigation/native';

// Home Tab Navigator Param List
export type HomeTabParamList = {
  HomeScreen: undefined;
  Calendar: undefined;
  Standings: undefined;
  Predict: undefined;
  Profile: undefined;
  RaceDetails: {
    raceId: string;
    season: string;
    round: string;
  };
};

// Root Stack Navigator Param List
export type RootStackParamList = {
  Home: NavigatorScreenParams<HomeTabParamList>;
  DriverDetail: { driverId: string };
  HeadToHead: { driver1Id?: string; driver2Id?: string };
  TrendAnalysis: { driverId: string };
  ConstructorAnalysis: { constructorId: string };
  Login: undefined;
  Register: undefined;
  About: undefined;
  MakePrediction: { season: string; round: string; raceId: string };
  Leaderboard: undefined;
};
