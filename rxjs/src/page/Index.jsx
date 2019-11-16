import React, { useEffect, useState } from "react";
import { range,Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent, combineLatest, SubscriptionLike, PartialObserver } from 'rxjs';
import {flatMap, map, filter, scan ,tap} from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { ajax } from 'rxjs/ajax';
import { TestScheduler } from 'rxjs/testing';
class Index extends React.Component {
  constructor(props) {
    super(props);
    // 设置初始状态
    this.state = {
      val: 0
    };
  }
  componentDidMount() {
    // do fetch
    this.aa()
  }

  componentWillUnmount() {
    // clean up
  }

  aa(){
    const source$ = range(1, 3)

    const liveStreaming$ = source$.pipe(
      flatMap(val => of(val).pipe(
        flatMap(val => from(fetch(`http://swapi.co/api/people/${val}`))),
        flatMap(res => from(res.json())),
        map(res => res.name),
        tap(console.log)
      ))
    )
    console.log(liveStreaming$ )
  }
  render() {
    return (
      <div>
        <h1>{this.state.val}</h1>
        <button>Click me</button>
        <button id="btn2">Show alert</button>
      </div>
    );
  }
}
export default Index;
