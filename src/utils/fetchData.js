import queryPerfData from '@mozilla-frontend-infra/perf-goggles';
import { BENCHMARKS, CONFIG } from '../config';
import prepareData from './prepareData';

const fetchData = async (platform, benchmark) => {
  const ALL_DATA = {};

  const fetchIt = async (configUID, overview = false, timeRange = CONFIG.default.timeRange) => {
    const includeSubtests = !overview;
    const comparingBenchmarks = Object.keys(BENCHMARKS[configUID].compare);
    return Promise.all(comparingBenchmarks
      .map(async (modeKey) => {
        const benchmarkOptions = BENCHMARKS[configUID].compare[modeKey];
        const seriesConfig = {
          platform: CONFIG.platforms[platform].platform,
          option: benchmarkOptions.buildType,
          ...benchmarkOptions,
        };
        const data = await queryPerfData(seriesConfig, includeSubtests, timeRange);
        if (data) {
          const { suite } = benchmarkOptions;
          const { color, label } = BENCHMARKS[configUID].compare[suite];

          Object.values(data).forEach((series) => {
            ALL_DATA[series.meta.id] = {
              ...series,
              configUID,
              color,
              label,
              suite,
            };
          });
        }
      }));
  };

  if (benchmark === 'overview') {
    const benchmarksToCompare = CONFIG.platforms[platform].benchmarks;
    await Promise.all(benchmarksToCompare
      .map(async (configUID) => {
        await fetchIt(configUID, true);
      }));
  } else {
    await fetchIt(benchmark);
  }
  return prepareData(ALL_DATA);
};

export default fetchData;
