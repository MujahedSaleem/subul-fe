import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  vertical?: boolean;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  vertical = false,
  className = ''
}) => {
  return (
    <div 
      className={`
        inline-flex
        ${vertical ? 'flex-col' : 'flex-row'}
        ${className}
      `}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${vertical
              ? index === 0
                ? 'rounded-t-lg rounded-b-none'
                : index === React.Children.count(children) - 1
                ? 'rounded-b-lg rounded-t-none'
                : 'rounded-none'
              : index === 0
              ? 'rounded-l-lg rounded-r-none'
              : index === React.Children.count(children) - 1
              ? 'rounded-r-lg rounded-l-none'
              : 'rounded-none'
            }
            ${index !== 0 && (vertical ? '-mt-px' : '-ml-px')}
          `,
        });
      })}
    </div>
  );
};

export default ButtonGroup;