'use strict'

const path = require('path')

// TODO(mc, 2017-12-22): Create common webpack config
const {rules} = require('@opentrons/webpack-config')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const DEV = process.env.NODE_ENV !== 'production'
const CSS_OUTPUT_NAME = 'style.css'

module.exports = {
  styleguideDir: 'dist',
  webpackConfig: {
    module: {
      rules: [
        rules.js,
        rules.localCss,
        rules.images
      ]
    },
    plugins: [
      new ExtractTextPlugin({
        filename: CSS_OUTPUT_NAME,
        disable: DEV,
        ignoreOrder: true
      })
    ]
  },
  showUsage: true,
  showCode: true,
  // TODO(mc, 2017-12-22): generate these sections automatically by walking src
  sections: [
    {
      name: 'Alerts',
      components: 'src/alerts/[A-Z]*.js'
    },
    {
      name: 'Nav',
      components: 'src/nav/[A-Z]*.js'
    },
    {
      name: 'Buttons',
      components: 'src/buttons/[A-Z]*.js'
    },
    {
      name: 'Form Components',
      components: 'src/forms/[A-Z]*.js'
    },
    {
      name: 'Icons',
      components: 'src/icons/[A-Z]*.js'
    },
    {
      name: 'Lists',
      components: 'src/lists/[A-Z]*.js'
    },
    {
      name: 'Modals',
      components: 'src/modals/[A-Z]*.js'
    },
    {
      name: 'Deck',
      components: 'src/deck/[A-Z]*.js'
    },
    {
      name: 'Instrument Diagram',
      components: 'src/instrument-diagram/[A-Z]*.js'
    },
    {
      name: 'Structure',
      components: 'src/structure/[A-Z]*.js'
    }
  ],
  getComponentPathLine (componentPath) {
    const name = path.basename(componentPath, '.js')

    return `import {${name}} from '@opentrons/components'`
  },
  styles: {
    StyleGuide: {
      '@global body': {
        fontFamily: "'Open Sans', sans-serif"
      },
      '@global .display-block': {
        display: 'block'
      },
      '@global .width-auto': {
        width: 'auto !important'
      },
      '@global .width-3-rem': {
        width: '3rem !important'
      },
      '@global .height-3-rem': {
        height: '3rem !important'
      },
      '@global .height-40-rem': {
        height: '40rem !important'
      },
      '@global .dark_background': {
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      },
      '@global .notification-icon-parent': {
        fill: '#333'
      },
      '@global .notification-icon-child': {
        fill: 'orange',
        bottom: '0',
        right: '0',
        width: '12px'
      }
    }
  }
}
