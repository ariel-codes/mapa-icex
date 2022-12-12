import { Controller } from '@hotwired/stimulus'

import L from 'leaflet'

import bbox from '@turf/bbox'
import { getCluster } from '@turf/clusters'
import { lineString } from '@turf/helpers'

import EdificioGeo from '../../assets/edificio.json'
import BaseGeo from '../../assets/base.json'
import Salas from '../../assets/salas.json'
import PontosReferencia from '../../assets/pontos-referencia.json'

import ImgPortaria from '../../assets/portaria.svg'
import ImgCantina from '../../assets/cafeteria.svg'
import ImgElevador from '../../assets/elevador.svg'
import ImgEscada from '../../assets/escada.svg'
import ImgBanheiroF from '../../assets/banheiro-f.svg'
import ImgBanheiroM from '../../assets/banheiro-m.svg'

export default class extends Controller {
  async connect() {
    this.map = L.map(this.element, { crs: L.CRS.Simple, minZoom: -2, maxZoom: 1, zoomControl: false })

    try {
      this.camadaEdificio = L.geoJSON(EdificioGeo, { style: { className: 'mapa mapa-edificio' } })
      this.camadaEdificio.addTo(this.map)

      const base = getCluster(BaseGeo, { andar: null })
      const iconesBase = {
        'escada': ImgEscada,
        'elevador': ImgElevador,
        'banheiro_f': ImgBanheiroF,
        'banheiro_m': ImgBanheiroM,
      }
      this.camadaBase = L.geoJSON(base, {
        style: this.styleBase,
        onEachFeature: (feature, layer) => {
          const tipo = feature.properties.tipo
          const tooltip = new L.Tooltip({
            content: `<img class='tooltip-icon' src='${iconesBase[tipo]}'/>`,
            className: 'tooltip-base',
            direction: 'auto',
            opacity: 1
          })
          tooltip.setLatLng(feature.geometry.coordinates)
          layer.bindTooltip(tooltip)
        }
      })

      this.baseAndar1 = getCluster(BaseGeo, { andar: 1 })
      this.camadaBaseAndar1 = L.geoJSON(this.baseAndar1, {
        style: this.styleBase,
        onEachFeature: (feature, layer) => {
          const tipo = feature.properties.tipo
          if (/banco|jardim|vazio/.test(tipo)) return

          const tooltip = new L.Tooltip({
            content: `<img class='tooltip-icon' src='${iconesBase[tipo]}'/>`,
            className: 'tooltip-base',
            direction: 'auto',
            opacity: 1
          })
          tooltip.setLatLng(feature.geometry.coordinates)
          layer.bindTooltip(tooltip)
        }
      })

      this.baseAndar2 = getCluster(BaseGeo, { andar: 2 })
      this.camadaBaseAndar2 = L.geoJSON(this.baseAndar2, {
        style: this.styleBase,
        onEachFeature: (feature, layer) => {
          const tipo = feature.properties.tipo
          if (/banco|jardim|vazio/.test(tipo)) return

          const tooltip = new L.Tooltip({
            content: `<img class='tooltip-icon' src='${iconesBase[tipo]}'/>`,
            className: 'tooltip-base',
            direction: 'auto',
            opacity: 1
          })
          tooltip.setLatLng(feature.geometry.coordinates)
          layer.bindTooltip(tooltip)
        }
      })

      const salasAndares = [getCluster(Salas, { andar: 1 }), getCluster(Salas, { andar: 2 })]
      this.camadasSalas = salasAndares.map((salasAndar) =>
        L.geoJSON(salasAndar, {
          onEachFeature: this.tooltipSala,
          className: 'mapa mapa-salas'
        })
      )

      const pontosReferencia = [getCluster(PontosReferencia, { andar: 1 }), getCluster(PontosReferencia, { andar: 2 })]
      const iconesReferencia = {
        'portaria': L.icon({
          iconUrl: ImgPortaria,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48]
        }),
        'cantina': L.icon({
          iconUrl: ImgCantina,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48]
        })
      }
      const camadasPontosReferencia = pontosReferencia.map((pontosReferenciaAndar) =>
        L.geoJSON(pontosReferenciaAndar, {
          pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: iconesReferencia[feature.properties.tipo] })
          },
          onEachFeature: (feature, layer) => {
            const tooltip = new L.Tooltip({
              content: feature.properties.nome,
              className: 'tooltip-referencias',
              direction: 'auto',
              opacity: 0.75
            })
            tooltip.setLatLng(feature.geometry.coordinates)
            layer.bindTooltip(tooltip)
          },
          className: 'mapa mapa-pontos-referencia',
        })
      )

      this.camadasAndares = [
        L.layerGroup([this.camadaBaseAndar1, this.camadaBase, this.camadasSalas[0], camadasPontosReferencia[0]]),
        L.layerGroup([this.camadaBaseAndar2, this.camadaBase, this.camadasSalas[1], camadasPontosReferencia[1]])
      ]
      this.controleAndar = L.control.layers(
        {
          "1º Andar": this.camadasAndares[0],
          "2º Andar": this.camadasAndares[1]
        }, {},
        {
          collapsed: false
        })
      this.controleAndar.addTo(this.map);
      this.controleAndar.setPosition('topleft')

      // selecionado à mão, +- no meio do jardim principal
      this.resetView()
    } catch (error) {
      console.error("Mande um email para ariel.santos@dcc.ufmg.br :)", error)
    }
  }

  styleBase = (feature) => {
    switch (feature.properties.tipo) {
      case 'escada':
        return { className: 'mapa mapa-escada' }
      case 'elevador':
        return { className: 'mapa mapa-elevador' }
      case 'banheiro_f':
        return { className: 'mapa mapa-banheiro-feminino' }
      case 'banheiro_m':
        return { className: 'mapa mapa-banheiro-masculino' }
      case 'vazio':
        return { className: 'mapa mapa-vazio' }
      case 'jardim':
        return { className: 'mapa mapa-jardim' }
      case 'banco':
        return { className: 'mapa mapa-banco' }
    }
  }

  tooltipSala(feature, layer) {
    const tooltip = new L.Tooltip({
      content: `Sala ${feature.properties.sala}`,
      className: 'tooltip-salas',
      direction: 'center',
      opacity: 1
    })
    // TODO: usar Turf
    const center = L.polygon(feature.geometry.coordinates).getBounds().getCenter()
    tooltip.setLatLng(center)
    layer.bindTooltip(tooltip)
  }

  // é preciso traduzir o formato do bbox do turf para do leaflet
  flyToBounds(bounds) {
    this.map.flyToBounds([[bounds[1], bounds[2]], [bounds[3], bounds[0]]])
  }

  mostrarSala(sala) {
    const andar = sala.properties.andar
    this.camadasAndares[andar - 1].addTo(this.map)
    this.camadasAndares[andar == 1 ? 1 : 0].removeFrom(this.map)

    this.camadaRota = this.camadaTurmaSelecionada(sala)

    const bboxSala = bbox(sala)
    this.flyToBounds(this.addMargem(bboxSala, 25))
  }

  camadaTurmaSelecionada(sala) {
    return L.geoJSON(sala, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: ImgPortaria,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48]
          })
        })
      },
      onEachFeature: (feature, layer) => {
        const tooltip = new L.Tooltip({
          permanent: true,
          content: `Sala ${feature.properties.sala}`,
          className: 'tooltip-turma',
          direction: 'center',
          opacity: 1,
        })
        tooltip.setLatLng(feature.geometry.coordinates)
        layer.bindTooltip(tooltip)
      },
      className: 'mapa mapa-turma',
    })
  }

  /**
   *
   * @param {Feature<LineString>} rota
   * @param {number} andar
   */
  mostrarRota(rota, sala) {
    this.mostrarSala(sala)

    this.camadaRota = L.layerGroup([
      L.polyline.antPath(rota.path.map(c => [c[1], c[0]]),
        { color: "darkred", pulseColor: 'white', weight: 7 }),
      this.camadaTurmaSelecionada(sala)
    ])

    const bboxRota = bbox(lineString(rota.path))
    this.flyToBounds(this.addMargem(bboxRota, 10))
  }

  addMargem(bbox, margem) {
    return [
      bbox[0] - margem,
      bbox[1] - margem,
      bbox[2] + margem,
      bbox[3] + margem
    ]
  }

  resetView() {
    const mobile = window.matchMedia('(max-width: 500px)').matches
    const zoomIdeal = mobile ? -2 : -1
    const centroIdeal = mobile ? [-378.5, 442.2] : [-220.0, 296.5]
    this.map.setView(centroIdeal, zoomIdeal)
  }

  reset() {
    this.camadaRota = null
    this.camadasAndares[0].removeFrom(this.map)
    this.camadasAndares[1].removeFrom(this.map)
    this.resetView()
  }

  /**
   * @param {L.GeoJSON} camada
   */
  set camadaRota(camada) {
    if (this._camadaRota) this._camadaRota.removeFrom(this.map)

    if (!camada) return
    this._camadaRota = camada
    camada.addTo(this.map)
  }

  /**
   * @returns {L.GeoJSON}
   */
  get camadaRota() {
    return this._camadaRota
  }
}
