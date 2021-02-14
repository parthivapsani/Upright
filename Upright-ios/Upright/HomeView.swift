//
//  ContentView.swift
//  Upright
//
//  Created by Daniel Edrisian on 2/13/21.
//

import SwiftUI
import Firebase
import SwiftCharts
import Introspect

struct HomeView: View {
  @ObservedObject var user = User.current
  
  var body: some View {
    NavigationView {
//      VStack {
//        Spacer()
//        GraphRepresentable()
//          .padding()
//        Divider()
      
//        HStack {
//          Spacer()
//          VStack {
//            Text("Statistics")
//              .bold()
//              .padding(.top, 15.0)
//              .padding(.bottom, 5.0)
//            Text("You've had good pose \(testPoses.filter { $0.slouch < 0.5 }.count) times this week!")
//              .bold()
//              .padding()
//            Text("☯️ Average: \(Int(testPoses.map { $0.slouch }.average() * 100))%")
//                .bold()
//            Text("🔥 Streak: \(testPoses.map { $0.slouch }.count)")
//              .bold()
//              .padding()
//            Text("🏅 Global Rank: #\(3)")
//              .bold()
//
//          }
//          Spacer()
//        }
//
        
        
//        .padding(.horizontal, 100.0)
//        .padding(.bottom, 180.0)
//        Spacer()
//      }
      Form {
        Section {
          HStack {
            Text("☯️ Average:")
            Spacer()
            Text("\(Int(testPoses.map { $0.slouch }.average() * 100))%")
          }
          HStack {
            Text("🔥 Streak:")
            Spacer()
            Text("\(testPoses.map { $0.slouch }.count)")
          }
          NavigationLink(
            destination: {
              Leaderboards()
            }(),
            label: {
              HStack {
                Text("🏅 Global Rank:")
                Spacer()
                Text("#\(1)")
              }
            })
        }
        Section {
          GraphRepresentable(poses: user.poses)
            .padding(.leading, -20.0)
            .padding(.top, 10.0)
            .padding(.bottom, 200.0)
            .introspectScrollView { scrollView in
              scrollView.isScrollEnabled = false
            }
        }
        Section {
          Button(action: {
            shareSheet()
          }, label: {
            HStack {
              Text("Share with your doctor")
              Spacer()
              Image(systemName: "square.and.arrow.up")
            }
          })
        }
      }
      .navigationTitle("\(user.firstName.capitalized)'s Stats")
    }
  }
  
  func shareSheet() {
    let activityViewController = UIActivityViewController(activityItems: ["I've had good posture \(testPoses.filter { $0.slouch < 0.5 }.count) times this week! Join Upright to see how well you sit at your desk http://joinupright.club"], applicationActivities: nil)
    UIApplication.shared.windows.first?.rootViewController?.present(activityViewController, animated: true, completion: nil)
  }
}

struct HomeView_Previews: PreviewProvider {
  static var previews: some View {
    HomeView()
  }
}

struct Leaderboards: View {
  var body: some View {
    List {
      Section {
      ForEach([(1,"🥇 John"), (2,"🥈 Ben"), (3,"🥉 Daniel")], id: \.0) { (index, name) in
        HStack {
          Text(name)
          Spacer()
          Text("#"+index.description)
            .foregroundColor(.secondary)
        }
      }
      }
      Section {
      Button(action: {
        shareSheet()
      }, label: {
        HStack {
          Text("Invite your friends")
          Spacer()
          Image(systemName: "square.and.arrow.up")
        }
      })
      }
    }
    .background(Color(#colorLiteral(red: 0.007595033385, green: 0.8409456611, blue: 0.7731608748, alpha: 1)))
    .listStyle(InsetGroupedListStyle())
    .navigationTitle("Leaderboards")
  }
  
  func shareSheet() {
    let activityViewController = UIActivityViewController(activityItems: ["I'm ranked #\(3) for posture in Upright! Join Upright to see how you rank for sitting at your desk http://joinupright.club"], applicationActivities: nil)
    UIApplication.shared.windows.first?.rootViewController?.present(activityViewController, animated: true, completion: nil)
  }
}


struct GraphRepresentable: UIViewControllerRepresentable {
  var poses: [Pose]
  func makeUIViewController(context: Context) -> MultiTrackerExample {
    let chart = MultiTrackerExample()
    chart.chartPoints = poses.map {
      return ChartPoint(
        x: ChartAxisValueDate(date: $0.date, formatter: dateFormatter),
        y: ChartAxisValueDouble($0.slouch)
      )
    }
    return chart
  }
  
  func updateUIViewController(_ uiViewController: MultiTrackerExample, context: Context) {
    
  }
}

extension Sequence where Element: AdditiveArithmetic {
  /// Returns the total sum of all elements in the sequence
  func sum() -> Element { reduce(.zero, +) }
}


extension Collection where Element: BinaryInteger {
  /// Returns the average of all elements in the array
  func average() -> Element { isEmpty ? .zero : sum() / Element(count) }
  /// Returns the average of all elements in the array as Floating Point type
  func average<T: FloatingPoint>() -> T { isEmpty ? .zero : T(sum()) / T(count) }
}

extension Collection where Element: BinaryFloatingPoint {
  /// Returns the average of all elements in the array
  func average() -> Element { isEmpty ? .zero : Element(sum()) / Element(count) }
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
