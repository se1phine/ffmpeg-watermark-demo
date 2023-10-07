import {
  BigPlayButton,
  ControlBar,
  LoadingSpinner,
  Player,
  PlayerReference,
  PlayerState,
  PlayToggle
} from "video-react"
import "video-react/dist/video-react.css"
import { useEffect, useState } from "react"

interface VideoPlayerProps {
  src: string;
  onPlayerChange: (pr: PlayerReference) => void;
  onChange: (ps: PlayerState) => void;
}

export function VideoPlayer({
                              src,
                              onPlayerChange = () => {},
                              onChange = () => {},
                            }: VideoPlayerProps) {
  const [player, setPlayer] = useState<PlayerReference | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)

  useEffect(() => {
    if (playerState) {
      onChange(playerState)
    }
  }, [playerState])

  useEffect(() => {
    if (player) {
      onPlayerChange(player)
      player.subscribeToStateChange(setPlayerState)
    }
  }, [player])

  return (
    <div className={"video-player"}>
      <Player
        ref={(player) => {
          if (player) setPlayer(player)
        }}
      >
        <source src={src} />
        <BigPlayButton position="center" />
        <LoadingSpinner />
        <ControlBar autoHide={false} disableDefaultControls={true}>
          <PlayToggle />
        </ControlBar>
      </Player>
    </div>
  )
}