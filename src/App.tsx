import Cube from "./components/Cube";
import { useTimerStore } from "./stores/useTimerStore";

const initialTime = 60
function increment(step: number) {
  return initialTime * 2 ** step;
}

export default function App() {

  const {remaining, setDuration, start, formatTime} = useTimerStore()

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900">
      <Cube
        size={180}
        initialFaces={{
            left: `${formatTime(increment(-1))}`,
            top: `${formatTime(increment(0))}`,
            right: `${formatTime(increment(1))}`,
        }}
        liveFaces={{
          front: `${formatTime(remaining)}`
        }}
        onRotate={({step}) => {
          setDuration({seconds: increment(step)})
          start()
          return {
            left: `${formatTime(increment(step-1))}`,
            top: `${formatTime(increment(step))}`,
            right: `${formatTime(increment(step+1))}`,
          }
        }}
      />
    </div>
  );
}