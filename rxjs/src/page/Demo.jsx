import React from "react";
import {
  Observable,
  fromEvent,
  interval,
  from,
  ReplaySubject,
  Subject,
  merge
} from "rxjs";
import moment from "moment";
import {
  throttleTime,
  scan,
  filter,
  debounceTime,
  delay,
  mapTo,
  withLatestFrom,
  startWith,
  map
} from "rxjs/operators";
class Demo extends React.Component {
  constructor(props) {
    super(props);
    // 设置初始状态
    this.state = {
      val: 0
    };
  }
  componentDidMount() {
    // do fetch
    // this.demoLast();
    this.demoLast();
  }

  componentWillUnmount() {
    // clean up
  }

  clickDemo() {
    fromEvent(document, "click")
      .pipe(
        throttleTime(1000),
        scan(count => count + 1, 0)
      )
      .subscribe(count => console.log(`Clicked ${count} times`));
  }

  /**
   * Demo1
   * 简单的订阅
   * 我们会有一些显示时间的场景，比如在页面下添加评论，评论列表中显示了它们分别是什么时间创建的，为了含义更清晰
   * 但组件并不一定只有一份实例，这样，整个界面上可能就有很多定时器在同时跑，这是一种浪费。
   * 如果要做优化，可以把定时器做成一种服务，把业务上需要周期执行的东西放进去，当作定时任务来跑。
   * @memberof Demo
   */
  demoDiff() {
    let diff;
    interval(1000).subscribe(() => {
      diff = moment("20191111", "YYYYMMDD").fromNow();
      console.log(diff)
    });
  }

  /**
   * Demo2
   * 对时间轴的操纵
   * RxJS一个很强大的特点是，它以流的方式来对待数据，因此，可以用一些操作符对整个流上所有的数据进行延时、取样、调整密集度等等。
   * A是由定时器产生的，每秒一个值
   * B从A里面过滤掉了一些
   * C在B的基础上，对每两个间距在3秒之内的值进行了处理，只留下后一个值
   * D把C的结果整体向后平移了2秒
   *
   * @memberof Demo
   */
  demoTime() {
    const timeA$ = interval(1000);
    const timeB$ = timeA$.pipe(
      filter(num => {
        return num % 2 != 0 && num % 3 != 0 && num % 5 != 0 && num % 7 != 0;
      })
    );
    const timeC$ = timeB$.pipe(debounceTime(3000));
    const timeD$ = timeC$.pipe(delay(2000));
    // timeA$.subscribe(x => console.log('a:'+ x));
    // timeB$.subscribe(x => console.log('b:'+ x));
    // timeC$.subscribe(x => console.log('c:'+ x));
    // timeD$.subscribe(x => console.log('D:'+ x));
  }

  /**
   * 我们来晚了
   * RxJS还提供了ReplaySubject这样的东西，用于记录数据流上一些比较重要的信息，让那些“我们来晚了”的订阅者们回放之前错过的一切。
   * ReplaySubject可以指定保留的值的个数，超过的部分会被丢弃。
   * 我们创建了一个 ReplaySubject 并指定其只存储最近两次广播的值；
   * 订阅 subject 并称其为订阅者A；
   * subject 连续广播三次，同时订阅者A 也会跟着连续打印三次；
   * 这一步就轮到 ReplaySubject 展现魔力了。我们再次订阅 subject 并称其为订阅者B，因为之前我们指定 subject 存储最近两次广播的值，所以 subject 会将上两个值“重播”给订阅者B。我们可以看到订阅者B 随即打印了这两个值；
   * subject 最后一次广播，两个订阅者收到值并打印。
   * @memberof Demo
   */
  demoDelay() {
    const subject$ = new ReplaySubject(2);
    // 订阅者 A
    subject$.subscribe(data => {
      console.log("Subscriber A:", data);
    });

    subject$.next(Math.random());
    subject$.next(Math.random());
    subject$.next(Math.random());

    // 订阅者 B
    subject$.subscribe(data => {
      console.log("Subscriber B:", data);
    });

    subject$.next(Math.random());
  }

  /**
   * 自动更新的状态树
   *
   * @memberof Demo
   */
  demoLast() {
    // 工资 := 定时取值的常量
    // 房租 := 定时取值的变量，与房子数量成正比
    // 钱 := 工资 + 房租
    // 房 := 钱.map(够了就买)


    // 工资始终不涨
    const salary$ = interval(5000).pipe(mapTo(20));
    const house$ = new Subject();
    const houseCount$ = house$.pipe(
      scan((acc, num) => acc + num, 0),
      startWith(0)
    );

    // 房租由房租周期的定时器触发
    // 然后到房子数量中取最后一个值，也就是当前有多少套房
    // 然后，用房子数量乘以单套房的月租，假设是5
    const rent$ = interval(3000).pipe(
      withLatestFrom(houseCount$),
      map(arr => arr[1] * 5)
    );

    // income$所代表的含义是，所有的单次收入，包含工资和房租。
    // 一买了房，就没现金了……
    const income$ = merge(salary$, rent$);

    //一旦现金流够买房，就去买。
    // 累积之前的现金流与本次收入
    // 假定房价100，先看看现金够买几套房，能买几套买几套
    // 重新计算买完之后的现金
    const cash$ = income$.pipe(
      scan((acc, num) => {
        const newSum = acc + num;
        const newHouse = Math.floor(newSum / 100);
        if (newHouse > 0) {
          house$.next(newHouse);
        }

        return newSum % 100;
      }, 0)
      
    );

    // house$.subscribe(item => console.log(item))
    // salary$.subscribe(item => console.log(item))
    cash$.subscribe(item => console.log("现金金额：" + item));
    houseCount$.subscribe(item => console.log("房子数量：" + item));
    rent$.subscribe(item => console.log("房租收入：" + item));

    //             工资周期  ———>  工资
    //                            ↓
    // 房租周期  ———>  租金  ———>  收入  ———>  现金
    //                 ↑           ↓
    //               房子数量 <——— 新购房
  }

  render() {
    return <div></div>;
  }
}
export default Demo;
