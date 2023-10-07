import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import VideoEditor from "./components/VideoEditor.tsx";
import './styles/index.css';
import { Button, Space, Spin } from "antd";

type LoadType = 'single' | 'multi';

function App() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async (type: LoadType) => {
    const baseURL = type === 'single'
      ? "https://registry.npmmirror.com/@ffmpeg/core/0.12.3/files/dist/esm"
      : "https://registry.npmmirror.com/@ffmpeg/core-mt/0.12.3/files/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      console.log({ message })
    });
    ffmpeg.on("progress", ({ progress, time }) => {
      console.log({ progress, time })
    })
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    setLoading(true);
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
        workerURL: await toBlobURL(
          type === 'single'
            ? 'https://registry.npmmirror.com/@ffmpeg/ffmpeg/0.12.6/files/dist/esm/worker.js'
            : 'https://registry.npmmirror.com/@ffmpeg/core-mt/0.12.3/files/dist/esm/ffmpeg-core.worker.js',
          "text/javascript"
        ),
      });
      setLoaded(true);
      window.ffmpeg = ffmpeg;
    } finally {
      setLoading(false);
    }
  };

  return loaded ? <VideoEditor ffmpegLoaded={loaded}/> : (
    <Spin spinning={loading}>
      <Space direction="vertical">
        <Button type="primary" onClick={() => load('single')}>Load ffmpeg-core(single core)</Button>
        <Button onClick={() => load('multi')}>Load ffmpeg-core(multi cores)</Button>
      </Space>
    </Spin>

  );
}

export default App;