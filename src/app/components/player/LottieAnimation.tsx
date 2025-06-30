import Lottie from 'lottie-react';
import animationData from '../../../../public/lottie/anim-ul.json';

interface LottieAnimationProps {
  show: boolean;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 md:top-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-0">
      <div className="w-[25vw] h-[25vw] min-w-[280px] min-h-[280px] max-w-[350px] max-h-[350px]">
        <Lottie 
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        />
      </div>
    </div>
  );
};
