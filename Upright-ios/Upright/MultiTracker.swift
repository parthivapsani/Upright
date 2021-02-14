//
//  MultiTrackerExample.swift
//  SwiftCharts
//
//  Created by Nate Racklyeft on 6/25/16.
//  Copyright © 2016 ivanschuetz. All rights reserved.
//

import UIKit
import SwiftCharts

// Configuration
private extension UIColor {
  static let secondaryLabelColor = UIColor(red: 142 / 255, green: 142 / 255, blue: 147 / 255, alpha: 1)
  
  static let gridColor = UIColor(white: 193 / 255, alpha: 1)
  
  static let glucoseTintColor = UIColor(red: 96 / 255, green: 201 / 255, blue: 248 / 255, alpha: 1)
  
  static let IOBTintColor: UIColor = UIColor(red: 254 / 255, green: 149 / 255, blue: 38 / 255, alpha: 1)
}

private let dateFormatter: DateFormatter = {
  let timeFormatter = DateFormatter()
  timeFormatter.dateStyle = .none
  timeFormatter.timeStyle = .short
  
  return timeFormatter
}()

private let localDateFormatter: DateFormatter = {
  let dateFormatter = DateFormatter()
  
  dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
  dateFormatter.locale = Locale(identifier: "en_US_POSIX")
  
  return dateFormatter
}()

private let decimalFormatter: NumberFormatter = {
  let numberFormatter = NumberFormatter()
  numberFormatter.numberStyle = .decimal
  numberFormatter.minimumFractionDigits = 2
  numberFormatter.maximumFractionDigits = 2
  
  return numberFormatter
}()

// MARK – Fixture data

private let testPoseChartPoints: [ChartPoint] = testPoses.map {
  return ChartPoint(
    x: ChartAxisValueDate(date: $0.date, formatter: dateFormatter),
    y: ChartAxisValueDouble($0.slouch)
  )
}


private let axisLabelSettings: ChartLabelSettings = ChartLabelSettings()


class MultiTrackerExample: UIViewController, UIGestureRecognizerDelegate {
  
  var chartPoints: [ChartPoint] = []
    
  fileprivate var topChart: Chart?
  
  fileprivate var bottomChart: Chart?
  
  fileprivate lazy private(set) var chartLongPressGestureRecognizer = UILongPressGestureRecognizer()
  
  // MARK: – Chart configuration
  
  fileprivate lazy private(set) var chartSettings: ChartSettings = {
    var chartSettings = ChartSettings()
    chartSettings.top = 12
    chartSettings.bottom = 0
    chartSettings.trailing = 8
    chartSettings.axisTitleLabelsToLabelsSpacing = 0
    chartSettings.labelsToAxisSpacingX = 6
    chartSettings.clipInnerFrame = false
    return chartSettings
  }()
  
  private let guideLinesLayerSettings: ChartGuideLinesLayerSettings = ChartGuideLinesLayerSettings()
  
  fileprivate lazy private(set) var axisLineColor = UIColor.clear
  
  fileprivate var xAxisValues: [ChartAxisValue]? {
    didSet {
      if let xAxisValues = xAxisValues {
        xAxisModel = ChartAxisModel(axisValues: xAxisValues, lineColor: axisLineColor, labelSpaceReservationMode: .fixed(20))
      } else {
        xAxisModel = nil
      }
    }
  }
  
  fileprivate var xAxisModel: ChartAxisModel?
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    chartLongPressGestureRecognizer.delegate = self
    chartLongPressGestureRecognizer.minimumPressDuration = 0.01
    view.addGestureRecognizer(chartLongPressGestureRecognizer)
    
    generateXAxisValues()
    
    let fullFrame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width - 10.0, height: UIScreen.main.bounds.width - 10.0)
    let (topFrame, bottomFrame) = fullFrame.divided(atDistance: fullFrame.height / 2, from: .minYEdge)
    
    topChart = generateGlucoseChartWithFrame(topFrame)
    
    for chart in [topChart] {
      if let view = chart?.view {
        self.view.addSubview(view)
      }
    }
  }
  
  fileprivate func generateXAxisValues() {
    let points = chartPoints
    
    guard points.count > 1 else {
      self.xAxisValues = []
      return
    }
    
    let timeFormatter = DateFormatter()
    timeFormatter.dateFormat = "hh:mm"
    
    let xAxisValues = ChartAxisValuesStaticGenerator.generateXAxisValuesWithChartPoints(points, minSegmentCount: 5, maxSegmentCount: 8, axisValueGenerator: { ChartAxisValueDate(date: ChartAxisValueDate.dateFromScalar($0), formatter: timeFormatter, labelSettings: axisLabelSettings)
    }, addPaddingSegmentIfEdge: false)
    xAxisValues.first?.hidden = true
    xAxisValues.last?.hidden = true
    
    self.xAxisValues = xAxisValues
  }
  
  fileprivate func generateGlucoseChartWithFrame(_ frame: CGRect) -> Chart? {
    guard chartPoints.count > 1, let xAxisValues = xAxisValues, let xAxisModel = xAxisModel else {
      return nil
    }
    
    let allPoints = chartPoints
    
    // TODO: The segment/multiple values are unit-specific
    let yAxisValues = ChartAxisValuesStaticGenerator.generateYAxisValuesWithChartPoints(allPoints, minSegmentCount: 0, maxSegmentCount: 10, multiple: 0.1, axisValueGenerator: { ChartAxisValueDouble($0, labelSettings: axisLabelSettings)}, addPaddingSegmentIfEdge: true)
    
    let yAxisModel = ChartAxisModel(axisValues: yAxisValues, lineColor: axisLineColor, labelSpaceReservationMode: .fixed(30))
    
    let coordsSpace = ChartCoordsSpaceLeftBottomSingleAxis(chartSettings: chartSettings, chartFrame: frame, xModel: xAxisModel, yModel: yAxisModel)
    
    let (xAxisLayer, yAxisLayer) = (coordsSpace.xAxisLayer, coordsSpace.yAxisLayer)
    
    let gridLayer = ChartGuideLinesForValuesLayer(xAxis: xAxisLayer.axis, yAxis: yAxisLayer.axis, settings: guideLinesLayerSettings, axisValuesX: Array(xAxisValues.dropLast(1)), axisValuesY: [])
    
    let circles = ChartPointsScatterCirclesLayer(xAxis: xAxisLayer.axis, yAxis: yAxisLayer.axis, chartPoints: chartPoints, displayDelay: 0, itemSize: CGSize(width: 8, height: 8), itemFillColor: UIColor.glucoseTintColor)
    
    let lineModel = ChartLineModel(
      chartPoints: allPoints,
      lineColor: UIColor.glucoseTintColor.withAlphaComponent(0.75),
      lineWidth: 1,
      animDuration: 0.5,
      animDelay: 1.0,
      dashPattern: [6, 5]
    )
    
    var prediction = ChartPointsLineLayer(xAxis: xAxisLayer.axis, yAxis: yAxisLayer.axis, lineModels: [lineModel], pathGenerator: CubicLinePathGenerator(tension1: 0.3, tension2: 0.3))
        
    let highlightLayer = ChartPointsTouchHighlightLayer(
      xAxisLayer: xAxisLayer,
      yAxisLayer: yAxisLayer,
      chartPoints: allPoints,
      tintColor: UIColor.glucoseTintColor,
      labelCenterY: chartSettings.top,
      gestureRecognizer: chartLongPressGestureRecognizer,
      onCompleteHighlight: nil
    )
    
    let layers: [ChartLayer?] = [
      gridLayer,
      xAxisLayer,
      yAxisLayer,
      highlightLayer,
      prediction,
      circles
    ]
    
    return Chart(frame: frame, innerFrame: coordsSpace.chartInnerFrame, settings: chartSettings, layers: layers.compactMap { $0 })
  }
}


/*
 Here we extend ChartPointsTouchHighlightLayer to contain its initialization
 */
private extension ChartPointsTouchHighlightLayer {
  
  convenience init(
    xAxisLayer: ChartAxisLayer,
    yAxisLayer: ChartAxisLayer,
    chartPoints: [T],
    tintColor: UIColor,
    labelCenterY: CGFloat = 0,
    gestureRecognizer: UILongPressGestureRecognizer? = nil,
    onCompleteHighlight: (()->Void)? = nil
  ) {
    self.init(xAxis: xAxisLayer.axis, yAxis: yAxisLayer.axis, chartPoints: chartPoints, gestureRecognizer: gestureRecognizer, onCompleteHighlight: onCompleteHighlight,
              modelFilter: { (screenLoc, chartPointModels) -> ChartPointLayerModel<T>? in
                if let index = chartPointModels.map({ $0.screenLoc.x }).findClosestElementIndexToValue(screenLoc.x) {
                  return chartPointModels[index]
                } else {
                  return nil
                }
              },
              viewGenerator: { (chartPointModel, layer, chart) -> U? in
                let containerView = U(frame: chart.contentView.bounds)
                
                let xAxisOverlayView = UIView(frame: CGRect(origin: CGPoint(x: 0, y: 3 + containerView.frame.size.height), size: xAxisLayer.frame.size))
                xAxisOverlayView.backgroundColor = UIColor.white
                xAxisOverlayView.isOpaque = true
                containerView.addSubview(xAxisOverlayView)
                
                let point = ChartPointEllipseView(center: chartPointModel.screenLoc, diameter: 16)
                point.fillColor = tintColor.withAlphaComponent(0.5)
                containerView.addSubview(point)
                
                if let text = chartPointModel.chartPoint.y.labels.first?.text {
                  let label = UILabel()
                  if #available(iOS 9.0, *) {
                    label.font = UIFont.monospacedDigitSystemFont(ofSize: 15, weight: .bold)
                  } else {
                    label.font = UIFont.systemFont(ofSize: 15)
                  }
                  
                  label.text = text
                  label.textColor = tintColor
                  label.textAlignment = .center
                  label.sizeToFit()
                  label.frame.size.height += 4
                  label.frame.size.width += label.frame.size.height / 2
                  label.center.y = containerView.frame.origin.y
                  label.center.x = chartPointModel.screenLoc.x
                  label.frame.origin.x = min(max(label.frame.origin.x, containerView.frame.origin.x), containerView.frame.maxX - label.frame.size.width)
                  label.frame.origin.makeIntegralInPlaceWithDisplayScale(chart.view.traitCollection.displayScale)
                  label.layer.borderColor = tintColor.cgColor
                  label.layer.borderWidth = 1 / chart.view.traitCollection.displayScale
                  label.layer.cornerRadius = label.frame.size.height / 2
                  label.backgroundColor = UIColor.white
                  
                  containerView.addSubview(label)
                }
                
                if let text = chartPointModel.chartPoint.x.labels.first?.text {
                  let label = UILabel()
                  label.font = axisLabelSettings.font
                  label.text = text
                  label.textColor = axisLabelSettings.fontColor
                  label.sizeToFit()
                  label.center = CGPoint(x: chartPointModel.screenLoc.x, y: xAxisOverlayView.center.y)
                  label.frame.origin.makeIntegralInPlaceWithDisplayScale(chart.view.traitCollection.displayScale)
                  
                  containerView.addSubview(label)
                }
                
                return containerView
              }
    )
  }
}


private extension CGPoint {
  /**
   Rounds the coordinates to whole-pixel values
   
   - parameter scale: The display scale to use. Defaults to the main screen scale.
   */
  mutating func makeIntegralInPlaceWithDisplayScale(_ scale: CGFloat = 0) {
    var scale = scale
    
    // It's possible for scale values retrieved from traitCollection objects to be 0.
    if scale == 0 {
      scale = UIScreen.main.scale
    }
    x = round(x * scale) / scale
    y = round(y * scale) / scale
  }
}


private extension BidirectionalCollection where Index: Strideable, Iterator.Element: Comparable, Index.Stride == Int {
  
  /**
   Returns the insertion index of a new value in a sorted collection
   
   Based on some helpful responses found at [StackOverflow](http://stackoverflow.com/a/33674192)
   
   - parameter value: The value to insert
   
   - returns: The appropriate insertion index, between `startIndex` and `endIndex`
   */
  func findInsertionIndexForValue(_ value: Iterator.Element) -> Index {
    var low = startIndex
    var high = endIndex
    
    while low != high {
      let mid = low.advanced(by: low.distance(to: high) / 2)
      
      if self[mid] < value {
        low = mid.advanced(by: 1)
      } else {
        high = mid
      }
    }
    
    return low
  }
}


private extension BidirectionalCollection where Index: Strideable, Iterator.Element: Strideable, Index.Stride == Int {
  /**
   Returns the index of the closest element to a specified value in a sorted collection
   
   - parameter value: The value to match
   
   - returns: The index of the closest element, or nil if the collection is empty
   */
  func findClosestElementIndexToValue(_ value: Iterator.Element) -> Index? {
    let upperBound = findInsertionIndexForValue(value)
    
    if upperBound == startIndex {
      if upperBound == endIndex {
        return nil
      }
      return upperBound
    }
    
    let lowerBound = upperBound.advanced(by: -1)
    
    if upperBound == endIndex {
      return lowerBound
    }
    
    if value.distance(to: self[upperBound]) < self[lowerBound].distance(to: value) {
      return upperBound
    }
    
    return lowerBound
  }
}
