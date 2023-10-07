import { ChangeEvent, useEffect, useRef, useState } from "react"
import { Button, Form, InputNumber, Modal, Slider, Space, Spin, Image } from "antd"
import { VideoPlayer } from "./VideoPlayer"
import { sliderValueToVideoTime } from "../utils/utils"
import VideoUpload from "./VideoUpload"
import { PlayerReference, PlayerState } from "video-react";
import { RcFile } from "antd/es/upload/interface";
import { fetchFile } from "@ffmpeg/util";

interface VideoEditorProps {
  ffmpegLoaded: boolean;
}

interface FormValues {
  transparence: number;
  sliderValues: [number, number];
  scale: number;
}

const formInitialValues: FormValues = {
  transparence: 50,
  sliderValues: [0, 100],
  scale: 100,
}

function VideoEditor({ ffmpegLoaded }: VideoEditorProps) {
  const [videoFile, setVideoFile] = useState<RcFile | null>(null)
  const [videoPlayerState, setVideoPlayerState] = useState<null | PlayerState>()
  const [videoPlayer, setVideoPlayer] = useState<PlayerReference | null>()
  const [processing, setProcessing] = useState(false)

  const [watermarkImageFileName, setWatermarkImageFileName] = useState<string>('');
  const imageRef = useRef<File>();
  const watermarkRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm<FormValues>();

  const mergeWatermark = async () => {
    const ffmpeg = window.ffmpeg;
    // starting the conversion process
    setProcessing(true)

    // writing the video file to memory
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile!));
    // write image to memory
    await ffmpeg.writeFile("watermark.jpg", await fetchFile(imageRef.current));

    const [min, max] = form.getFieldValue('sliderValues')
    const minTime = sliderValueToVideoTime(videoPlayerState!.duration, min)
    const maxTime = sliderValueToVideoTime(videoPlayerState!.duration, max)

    // cutting the video and converting it to GIF with a FFMpeg command
    const transparence = form.getFieldValue('transparence');
    const scale = form.getFieldValue('scale');
    await ffmpeg.exec([
      "-i", "input.mp4",
      "-i", "watermark.jpg",
      "-filter_complex", `[1:v]format=yuva444p,colorchannelmixer=aa=${(transparence / 100).toFixed(2)},scale=iw*${(scale / 100).toFixed(2)}:-1[watermark];[0:v][watermark]overlay=W-w:H-h`,
      '-c:a', 'copy',
      '-preset', 'ultrafast',
      "-ss", `${minTime}`, "-to", `${maxTime}`,
      '-y', "output.mp4",
    ])

    const data = await ffmpeg.readFile("output.mp4")

    const resultUrl = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: "video/mpeg" }))
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = "result.mp4"
    a.click()
    // ending the conversion process
    setProcessing(false)
  }

  const previewFirstFrame = async () => {
    const ffmpeg = window.ffmpeg;
    // starting the conversion process
    setProcessing(true)

    await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile!));
    await ffmpeg.writeFile("watermark.jpg", await fetchFile(imageRef.current));

    const transparence = form.getFieldValue('transparence');
    const scale = form.getFieldValue('scale');
    await ffmpeg.exec([
      "-i", "input.mp4",
      "-i", "watermark.jpg",
      "-filter_complex", `[1:v]format=yuva444p,colorchannelmixer=aa=${(transparence / 100).toFixed(2)},scale=iw*${(scale / 100).toFixed(2)}:-1[watermark];[0:v][watermark]overlay=W-w:H-h`,
      "-vframes", "1", "first_frame.png"
    ])
    const data = await ffmpeg.readFile("first_frame.png")
    const resultUrl = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: "image/jpg" }))

    Modal.info({
      title: "Preview First Frame",
      content: <Image src={resultUrl}/>,
      onCancel: () => {
        setProcessing(false);
      },
      onOk: () => {
        setProcessing(false);
      }
    })
  }

  const handleSelectWatermarkImage = (e: ChangeEvent<HTMLInputElement>) => {
    imageRef.current = e.target.files![0];
    const filename = imageRef.current.name;
    setWatermarkImageFileName(filename);
  }

  useEffect(() => {
    if (form && videoPlayer && videoPlayerState) {
      // allowing users to watch only the portion of
      // the video selected by the slider
      const [min, max] = form.getFieldValue('sliderValues')
      const minTime = sliderValueToVideoTime(videoPlayerState.duration, min)
      const maxTime = sliderValueToVideoTime(videoPlayerState.duration, max)

      if (videoPlayerState.currentTime < minTime) {
        videoPlayer.seek(minTime)
      }
      if (videoPlayerState.currentTime > maxTime) {
        // looping logic
        videoPlayer.seek(minTime)
      }
    }
  }, [form, videoPlayer, videoPlayerState])

  useEffect(() => {
    // when the current videoFile is removed,
    // restoring the default state
    if (form && videoFile === null) {
      setVideoPlayerState(undefined)
      form.setFieldValue('sliderValues', [0, 100])
      setVideoPlayerState(undefined)
    }
  }, [form, videoFile])

  return (
    <div>
      <Spin
        spinning={processing || !ffmpegLoaded}
        tip={!ffmpegLoaded ? "Waiting for FFmpeg to load..." : "Processing..."}
      >
        <div>
          {videoFile ? (
            <VideoPlayer
              src={URL.createObjectURL(videoFile)}
              onPlayerChange={setVideoPlayer}
              onChange={setVideoPlayerState}
            />
          ) : null}
        </div>
        <div>
          <VideoUpload
            disabled={!!videoFile}
            onChange={setVideoFile}
            onRemove={() => {
              setVideoFile(null)
            }}
          />
        </div>
        {videoFile ? (
          <Form form={form} initialValues={formInitialValues}>
            <Form.Item label="Cut Video" name="sliderValues">
              <Slider
                disabled={!videoPlayerState}
                range={true}
                onChange={(values) => {
                  const [min] = values
                  if (min !== undefined && videoPlayerState && videoPlayer) {
                    videoPlayer.seek(sliderValueToVideoTime(videoPlayerState.duration, min))
                  }
                }}
                tooltip={{ formatter: null }}
              />
            </Form.Item>
            <Form.Item label="Transparence" name="transparence">
              <InputNumber min={1} max={100} suffix="%"/>
            </Form.Item>
            <Form.Item label="Scale" name="scale">
              <InputNumber min={1} max={1000} suffix="%"/>
            </Form.Item>

            <Space direction="vertical">
              {watermarkImageFileName ? <div>
                Watermark Image: {watermarkImageFileName}
              </div> : null}

              <Button
                type={watermarkImageFileName ? 'default' : 'primary'}
                onClick={() => watermarkRef.current?.click()}
              >
                {watermarkImageFileName ? 'Change' : 'Select'}&nbsp;
                Watermark Image
              </Button>
              <input className="hidden" ref={watermarkRef} accept="image/*" type="file"
                     onChange={handleSelectWatermarkImage}/>

              {watermarkImageFileName ? <>
                <Button type="primary" onClick={mergeWatermark}>Merge a image & Save</Button>
                <Button type="primary" onClick={previewFirstFrame}>Preview First Frame</Button>
              </> : null}
            </Space>
          </Form>
        ) : null}
      </Spin>
    </div>
  )
}

export default VideoEditor