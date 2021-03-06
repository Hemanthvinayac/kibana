import angular from 'angular';
import _ from 'lodash';
import ngMock from 'ng_mock';
import expect from 'expect.js';

import dataSeries from 'fixtures/vislib/mock_data/date_histogram/_series';
import dataSeriesNeg from 'fixtures/vislib/mock_data/date_histogram/_series_neg';
import dataStacked from 'fixtures/vislib/mock_data/stacked/_stacked';
import VislibLibDataProvider from 'ui/vislib/lib/data';
import PersistedStatePersistedStateProvider from 'ui/persisted_state/persisted_state';

const seriesData = {
  'label': '',
  'series': [
    {
      'label': '100',
      'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
    }
  ]
};

const rowsData = {
  'rows': [
    {
      'label': 'a',
      'series': [
        {
          'label': '100',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'b',
      'series': [
        {
          'label': '300',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'c',
      'series': [
        {
          'label': '100',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'd',
      'series': [
        {
          'label': '200',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    }
  ]
};

const colsData = {
  'columns': [
    {
      'label': 'a',
      'series': [
        {
          'label': '100',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'b',
      'series': [
        {
          'label': '300',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'c',
      'series': [
        {
          'label': '100',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    },
    {
      'label': 'd',
      'series': [
        {
          'label': '200',
          'values': [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]
        }
      ]
    }
  ]
};

describe('Vislib Data Class Test Suite', function () {
  let Data;
  let persistedState;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (Private) {
    Data = Private(VislibLibDataProvider);
    persistedState = new (Private(PersistedStatePersistedStateProvider))();
  }));

  describe('Data Class (main)', function () {
    it('should be a function', function () {
      expect(_.isFunction(Data)).to.be(true);
    });

    it('should return an object', function () {
      const rowIn = new Data(rowsData, {}, persistedState);
      expect(_.isObject(rowIn)).to.be(true);
    });
  });


  describe('_removeZeroSlices', function () {
    let data;
    const pieData = {
      slices: {
        children: [
          {size: 30},
          {size: 20},
          {size: 0}
        ]
      }
    };

    beforeEach(function () {
      data = new Data(pieData, {}, persistedState);
    });

    it('should remove zero values', function () {
      const slices = data._removeZeroSlices(data.data.slices);
      expect(slices.children.length).to.be(2);
    });
  });

  describe('Data.flatten', function () {
    let serIn;
    let rowIn;
    let colIn;
    let serOut;
    let rowOut;
    let colOut;

    beforeEach(function () {
      serIn = new Data(seriesData, {}, persistedState);
      rowIn = new Data(rowsData, {}, persistedState);
      colIn = new Data(colsData, {}, persistedState);
      serOut = serIn.flatten();
      rowOut = rowIn.flatten();
      colOut = colIn.flatten();
    });

    it('should return an array of value objects from every series', function () {
      expect(serOut.every(_.isObject)).to.be(true);
    });

    it('should return all points from every series', testLength(seriesData));
    it('should return all points from every series', testLength(rowsData));
    it('should return all points from every series', testLength(colsData));

    function testLength(inputData) {
      return function () {
        const data = new Data(inputData, {}, persistedState);
        const len = _.reduce(data.chartData(), function (sum, chart) {
          return sum + chart.series.reduce(function (sum, series) {
            return sum + series.values.length;
          }, 0);
        }, 0);

        expect(data.flatten()).to.have.length(len);
      };
    }
  });

  describe('getYMin method', function () {
    let visData;
    let visDataNeg;
    let visDataStacked;
    const minValue = 4;
    const minValueNeg = -41;
    const minValueStacked = 15;

    beforeEach(function () {
      visData = new Data(dataSeries, {}, persistedState);
      visDataNeg = new Data(dataSeriesNeg, {}, persistedState);
      visDataStacked = new Data(dataStacked, { type: 'histogram' }, persistedState);
    });

    // The first value in the time series is less than the min date in the
    // date range. It also has the largest y value. This value should be excluded
    // when calculating the Y max value since it falls outside of the range.
    it('should return the Y domain min value', function () {
      expect(visData.getYMin()).to.be(minValue);
      expect(visDataNeg.getYMin()).to.be(minValueNeg);
      expect(visDataStacked.getYMin()).to.be(minValueStacked);
    });

    it('should have a minimum date value that is greater than the max value within the date range', function () {
      const series = _.pluck(visData.chartData(), 'series');
      const stackedSeries = _.pluck(visDataStacked.chartData(), 'series');
      expect(_.min(series.values, function (d) { return d.x; })).to.be.greaterThan(minValue);
      expect(_.min(stackedSeries.values, function (d) { return d.x; })).to.be.greaterThan(minValueStacked);
    });

    it('allows passing a value getter for manipulating the values considered', function () {
      const realMin = visData.getYMin();
      const multiplier = 13.2;
      expect(visData.getYMin(function (d) { return d.y * multiplier; })).to.be(realMin * multiplier);
    });
  });

  describe('getYMax method', function () {
    let visData;
    let visDataNeg;
    let visDataStacked;
    const maxValue = 41;
    const maxValueNeg = -4;
    const maxValueStacked = 115;

    beforeEach(function () {
      visData = new Data(dataSeries, {}, persistedState);
      visDataNeg = new Data(dataSeriesNeg, {}, persistedState);
      visDataStacked = new Data(dataStacked, { type: 'histogram' }, persistedState);
    });

    // The first value in the time series is less than the min date in the
    // date range. It also has the largest y value. This value should be excluded
    // when calculating the Y max value since it falls outside of the range.
    it('should return the Y domain min value', function () {
      expect(visData.getYMax()).to.be(maxValue);
      expect(visDataNeg.getYMax()).to.be(maxValueNeg);
      expect(visDataStacked.getYMax()).to.be(maxValueStacked);
    });

    it('should have a minimum date value that is greater than the max value within the date range', function () {
      const series = _.pluck(visData.chartData(), 'series');
      const stackedSeries = _.pluck(visDataStacked.chartData(), 'series');
      expect(_.min(series, function (d) { return d.x; })).to.be.greaterThan(maxValue);
      expect(_.min(stackedSeries, function (d) { return d.x; })).to.be.greaterThan(maxValueStacked);
    });

    it('allows passing a value getter for manipulating the values considered', function () {
      const realMax = visData.getYMax();
      const multiplier = 13.2;
      expect(visData.getYMax(function (d) { return d.y * multiplier; })).to.be(realMax * multiplier);
    });
  });

  describe('geohashGrid methods', function () {
    let data;
    const geohashGridData = {
      hits: 3954,
      rows: [{
        title: 'Top 5 _type: apache',
        label: 'Top 5 _type: apache',
        geoJson: {
          type: 'FeatureCollection',
          features: [],
          properties: {
            min: 2,
            max: 331,
            zoom: 3,
            center: [
              47.517200697839414,
              -112.06054687499999
            ]
          }
        },
      }, {
        title: 'Top 5 _type: nginx',
        label: 'Top 5 _type: nginx',
        geoJson: {
          type: 'FeatureCollection',
          features: [],
          properties: {
            min: 1,
            max: 88,
            zoom: 3,
            center: [
              47.517200697839414,
              -112.06054687499999
            ]
          }
        },
      }]
    };

    beforeEach(function () {
      data = new Data(geohashGridData, {}, persistedState);
    });

    describe('getVisData', function () {
      it('should return the rows property', function () {
        const visData = data.getVisData();
        expect(visData).to.eql(geohashGridData.rows);
      });
    });

    describe('getGeoExtents', function () {
      it('should return the min and max geoJson properties', function () {
        const minMax = data.getGeoExtents();
        expect(minMax.min).to.be(1);
        expect(minMax.max).to.be(331);
      });
    });
  });

  describe('null value check', function () {
    it('should return false', function () {
      const data = new Data(rowsData, {}, persistedState);
      expect(data.hasNullValues()).to.be(false);
    });

    it('should return true', function () {
      const nullRowData = { rows: rowsData.rows.slice(0) };
      nullRowData.rows.push({
        'label': 'e',
        'series': [
          {
            'label': '200',
            'values': [{x: 0, y: 1}, {x: 1, y: null}, {x: 2, y: 3}]
          }
        ]
      });

      const data = new Data(nullRowData, {}, persistedState);
      expect(data.hasNullValues()).to.be(true);
    });
  });
});
