import { Controller } from '@hotwired/stimulus'

import "leaflet/dist/leaflet.css"
import L from 'leaflet'

import bbox from '@turf/bbox'
import { lineString } from '@turf/helpers'

import EdificioGeo from '../../assets/edificio.json'
import BaseGeo from '../../assets/base.json'

export default class extends Controller {
  async connect() {
    this.map = L.map(this.element, { crs: L.CRS.Simple, minZoom: -1, maxZoom: 1 })

    try {
      this.camadaEdificio = L.geoJSON(EdificioGeo, { style: { className: 'mapa-edificio' } })
      this.camadaEdificio.addTo(this.map)

      this.camadaBase = L.geoJSON(BaseGeo, {
        style: (feature) => {
          switch (feature.properties.tipo) {
            case "banco":
              return {
                weight: 0.5,
                color: 'black',
                fillColor: 'gray',
                fillOpacity: 1
              }
            case "jardim":
              return { fillColor: 'green' }
            case "vazio":
              return { fillColor: 'white' }
          }
        }
      })
      this.camadaBase.addTo(this.map)
      // // L.control.layers({}).addTo(this.map);

      // const salas = (await (await fetch('/salas-z.geojson')).json())
      // L.geoJSON(salas, {
      //   style: {
      //     weight: 0.5,
      //     color: 'black',
      //     fillColor: 'yellow',
      //     fillOpacity: 1
      //   }
      // }).addTo(this.map);

      const bounds = bbox(EdificioGeo)
      this.map.fitBounds([[bounds[1], bounds[2]], [bounds[3], bounds[0]]])
    } catch (error) {

    } finally {

    }
  }

  /**
   *
   * @param {Feature<LineString>} rota
   */
  mostrarRota(rota) {
    const rotaGeo = lineString(rota.path)
    this.camadaRota = L.geoJSON(rotaGeo)
  }

  /**
   * @param {L.GeoJSON} camada
   */
  set camadaRota(camada) {
    if (this._camadaRota)
      this._camadaRota.removeFrom(this.map)

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
