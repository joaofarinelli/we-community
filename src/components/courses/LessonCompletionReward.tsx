import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Award, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonCompletionRewardProps {
  isVisible: boolean;
  onClose: () => void;
  rewards: {
    lessonCoins: number;
    moduleComplete?: boolean;
    moduleCoins?: number;
    courseComplete?: boolean;
    courseCoins?: number;
  };
}

export const LessonCompletionReward = ({ 
  isVisible, 
  onClose, 
  rewards 
}: LessonCompletionRewardProps) => {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowRewards(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowRewards(false);
    }
  }, [isVisible]);

  const totalCoins = rewards.lessonCoins + (rewards.moduleCoins || 0) + (rewards.courseCoins || 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-8 max-w-md w-full text-center space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Main completion icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Parabéns!</h3>
                <p className="text-muted-foreground">Você completou a lição e ganhou recompensas</p>
              </div>

              {/* Rewards */}
              <AnimatePresence>
                {showRewards && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Lesson completion reward */}
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Badge variant="secondary" className="px-4 py-2 text-base">
                        <Coins className="h-4 w-4 mr-2 text-primary" />
                        +{rewards.lessonCoins} moedas pela lição
                      </Badge>
                    </motion.div>

                    {/* Module completion bonus */}
                    {rewards.moduleComplete && (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Badge variant="default" className="px-4 py-2 text-base bg-gradient-to-r from-primary to-primary/80">
                          <Award className="h-4 w-4 mr-2" />
                          +{rewards.moduleCoins} bônus por completar o módulo!
                        </Badge>
                      </motion.div>
                    )}

                    {/* Course completion bonus */}
                    {rewards.courseComplete && (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Badge variant="default" className="px-4 py-2 text-base bg-gradient-to-r from-primary via-primary/90 to-secondary">
                          <Trophy className="h-4 w-4 mr-2" />
                          +{rewards.courseCoins} bônus por completar o curso!
                        </Badge>
                      </motion.div>
                    )}

                    {/* Total */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                      className="pt-4 border-t border-border"
                    >
                      <div className="text-2xl font-bold text-primary">
                        Total: {totalCoins} moedas
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={onClose} className="w-full">
                Continuar
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};