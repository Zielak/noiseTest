class LoadBalancer {
  private runningJobs: number[] = []

  constructor(
    private workers: Worker[],
    onmessage: (event: MessageEvent) => void
  ) {
    this.workers.forEach((worker, idx) => {
      this.runningJobs[idx] = 0
      worker.onmessage = e => {
        this.runningJobs[idx]--
        console.debug(`[ ${idx} ] Job complete `)
        onmessage(e)
      }
    })
  }

  postMessage(data: any) {
    let vacant = 0
    for (let i in this.runningJobs) {
      if (this.runningJobs[i] < this.runningJobs[vacant]) {
        vacant = parseInt(i)
      }
    }
    console.debug(`[ ${vacant} ] Sending task to `)
    this.runningJobs[vacant]++
    this.workers[vacant].postMessage(data)
  }

  postMessageAll(data: any) {
    this.workers.forEach((worker, idx) => {
      this.runningJobs[idx]++
      worker.postMessage(data)
    })
  }
}

export { LoadBalancer }
